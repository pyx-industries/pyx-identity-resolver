import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { IRepositoryProvider } from '../repository/providers/provider.repository.interface';
import { buildApiBaseUrl } from '../common/utils/config.utils';
import { migrateUriDocument } from './v4-transform';
import {
  parseArgs,
  describeOutcome,
  HELP_TEXT,
  Options,
  ParseResult,
  Summary,
} from './v4-cli.utils';

const LINK_INDEX_PREFIX = '_index/links/';

interface IdentifierRecord {
  namespace: string;
  namespaceURI?: string;
}

async function main() {
  let parsed: ParseResult;
  try {
    parsed = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exit(2);
  }
  if (parsed.helpRequested) {
    process.stdout.write(HELP_TEXT);
    process.exit(0);
  }
  const opts = parsed.options;
  const logger = new Logger('migrate:v4');

  if (opts.dryRun) {
    logger.log('Dry-run mode: no objects will be written.');
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const repo = app.get<IRepositoryProvider>('RepositoryProvider');
  const config = app.get(ConfigService);

  const identifierPath = config.get<string>('IDENTIFIER_PATH') ?? 'identifiers';

  let apiBaseUrl: string;
  try {
    apiBaseUrl = buildApiBaseUrl(config);
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    await app.close();
    process.exit(2);
  }

  const summary: Summary = {
    scanned: 0,
    migrated: 0,
    noop: 0,
    failed: [],
  };

  try {
    if (opts.only) {
      await processOne(
        opts.only,
        repo,
        identifierPath,
        apiBaseUrl,
        opts,
        summary,
        logger,
      );
    } else {
      await processAll(repo, identifierPath, apiBaseUrl, opts, summary, logger);
    }
  } finally {
    await app.close();
  }

  logger.log('---');
  logger.log(`Scanned:  ${summary.scanned}`);
  logger.log(`Migrated: ${summary.migrated}${opts.dryRun ? ' (dry-run)' : ''}`);
  logger.log(`No-ops:   ${summary.noop}`);
  logger.log(`Failed:   ${summary.failed.length}`);
  if (summary.failed.length) {
    for (const failure of summary.failed) {
      logger.error(`  ${failure.id}: ${failure.error}`);
    }
    process.exit(1);
  }
}

function resolveLinkTypeVocDomain(
  identifier: IdentifierRecord | undefined,
  apiBaseUrl: string,
): string {
  return identifier?.namespaceURI && identifier.namespaceURI !== ''
    ? identifier.namespaceURI
    : `${apiBaseUrl}/voc`;
}

async function processAll(
  repo: IRepositoryProvider,
  identifierPath: string,
  apiBaseUrl: string,
  opts: Options,
  summary: Summary,
  logger: Logger,
): Promise<void> {
  const identifiers = await repo.all<IdentifierRecord>(identifierPath);
  for (const identifier of identifiers) {
    if (!identifier?.namespace) continue;
    const linkTypeVocDomain = resolveLinkTypeVocDomain(identifier, apiBaseUrl);
    const docs = await repo.all<any>(`${identifier.namespace}/`);
    for (const doc of docs) {
      if (!isUriDocument(doc)) continue;
      await processDoc(doc, repo, opts, summary, logger, {
        resolverDomain: apiBaseUrl,
        linkTypeVocDomain,
      });
    }
  }
}

async function processOne(
  id: string,
  repo: IRepositoryProvider,
  identifierPath: string,
  apiBaseUrl: string,
  opts: Options,
  summary: Summary,
  logger: Logger,
): Promise<void> {
  const doc = await repo.one<any>(id);
  if (!doc) {
    summary.failed.push({ id, error: 'document not found' });
    return;
  }
  if (!isUriDocument(doc)) {
    summary.failed.push({
      id,
      error: 'not a URI document (no `responses` array)',
    });
    return;
  }
  const identifier = await repo.one<IdentifierRecord>(
    `${identifierPath}/${doc.namespace}`,
  );
  const linkTypeVocDomain = resolveLinkTypeVocDomain(
    identifier ?? undefined,
    apiBaseUrl,
  );
  await processDoc(doc, repo, opts, summary, logger, {
    resolverDomain: apiBaseUrl,
    linkTypeVocDomain,
  });
}

async function processDoc(
  doc: any,
  repo: IRepositoryProvider,
  opts: Options,
  summary: Summary,
  logger: Logger,
  attrs: { resolverDomain: string; linkTypeVocDomain: string },
): Promise<void> {
  summary.scanned += 1;
  const id = doc.id ?? '(unknown id)';
  try {
    const { document, outcome } = migrateUriDocument(doc, attrs);
    if (!outcome.mutated) {
      summary.noop += 1;
      if (opts.verbose) {
        logger.log(`[noop] ${id}: already in v4 shape`);
      }
      return;
    }
    summary.migrated += 1;
    const description = describeOutcome(outcome);
    if (opts.dryRun) {
      logger.log(`[would-migrate] ${id}: ${description}`);
      return;
    }
    await repo.save(document);
    await deleteOrphanLinkIndexes(repo, outcome.discardedLinkIds, logger, id);
    logger.log(`[migrated] ${id}: ${description}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    summary.failed.push({ id, error: message });
    logger.error(`[failed] ${id}: ${message}`);
    if (!opts.continueOnError) {
      throw new Error(
        `Aborting on first failure (re-run with --continue-on-error to skip).`,
      );
    }
  }
}

async function deleteOrphanLinkIndexes(
  repo: IRepositoryProvider,
  discardedLinkIds: string[],
  logger: Logger,
  docId: string,
): Promise<void> {
  for (const linkId of discardedLinkIds) {
    const objectName = `${LINK_INDEX_PREFIX}${linkId}.json`;
    try {
      await repo.delete(objectName);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn(
        `[orphan-index] ${docId}: could not delete ${objectName}: ${message}`,
      );
    }
  }
}

function isUriDocument(doc: any): boolean {
  return (
    !!doc &&
    typeof doc === 'object' &&
    Array.isArray(doc.responses) &&
    typeof doc.namespace === 'string' &&
    typeof doc.identificationKey === 'string'
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
