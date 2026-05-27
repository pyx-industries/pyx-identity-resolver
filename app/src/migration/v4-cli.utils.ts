import { MigrationOutcome } from './v4-transform';

export interface Options {
  dryRun: boolean;
  continueOnError: boolean;
  only?: string;
  verbose: boolean;
}

export interface Summary {
  scanned: number;
  migrated: number;
  noop: number;
  failed: { id: string; error: string }[];
}

export interface ParseResult {
  options: Options;
  helpRequested: boolean;
  helpText: string;
}

export const HELP_TEXT = `
Usage: yarn migrate:v4 [options]

Migrates stored URI documents from the legacy 5-tuple key model
(targetUrl, linkType, mimeType, ianaLanguage, context) to the v4 4-tuple
model (targetUrl, linkType, mimeType, context). See
documentation/docs/migration-guides/v4.md before running.

Options:
  --dry-run               List what would change without writing anything.
  --continue-on-error     Keep migrating other documents if one fails.
                          Default is to abort on the first failure.
  --only <id>             Migrate a single document by storage id, e.g.
                          --only gs1/01/09359502000041
  --verbose               Log each scanned document (default: skipped no-ops
                          are silent).
  -h, --help              Print this help and exit.
`;

/**
 * Parses the CLI argv slice for `yarn migrate:v4`. Returns the parsed
 * options and a `helpRequested` flag so the caller can decide whether
 * to print help and exit, rather than `process.exit`-ing from inside
 * the parser (which would make the parser untestable).
 *
 * @throws if `--only` is missing its value or an unknown argument is
 *   passed.
 */
export function parseArgs(argv: string[]): ParseResult {
  const options: Options = {
    dryRun: false,
    continueOnError: false,
    verbose: false,
  };
  let helpRequested = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--continue-on-error':
        options.continueOnError = true;
        break;
      case '--only':
        options.only = argv[++i];
        if (!options.only) {
          throw new Error('--only requires a document id argument');
        }
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '-h':
      case '--help':
        helpRequested = true;
        break;
      default:
        throw new Error(`Unrecognised argument: ${arg}`);
    }
  }
  return { options, helpRequested, helpText: HELP_TEXT };
}

/**
 * Renders a single-line human-readable summary of one document's
 * migration outcome for the CLI logger. Empty when no observable
 * changes were applied.
 */
export function describeOutcome(outcome: MigrationOutcome): string {
  const parts: string[] = [];
  if (outcome.inputResponseCount !== outcome.outputResponseCount) {
    const collapsed = outcome.inputResponseCount - outcome.outputResponseCount;
    parts.push(
      `${outcome.inputResponseCount} variants -> ${outcome.outputResponseCount} (merged ${collapsed})`,
    );
  } else {
    parts.push(`${outcome.outputResponseCount} variants`);
  }
  if (outcome.rewrittenVersionEntries > 0) {
    parts.push(`${outcome.rewrittenVersionEntries} version entries rewritten`);
  }
  if (outcome.discardedLinkIds.length > 0) {
    parts.push(
      `${outcome.discardedLinkIds.length} discarded variant ${outcome.discardedLinkIds.length === 1 ? 'link-id' : 'link-ids'}`,
    );
  }
  return parts.join('; ');
}
