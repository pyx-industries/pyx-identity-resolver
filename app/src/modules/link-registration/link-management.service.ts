import {
  ConflictException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ConfigService } from '@nestjs/config';
import { IRepositoryProvider } from '../../repository/providers/provider.repository.interface';
import { IdentifierManagementService } from '../identifier-management/identifier-management.service';
import { GeneralErrorException } from '../../common/exceptions/general-error.exception';
import {
  CreateLinkRegistrationDto,
  Response,
} from './dto/link-registration.dto';
import { ListLinksQueryDto, UpdateLinkDto } from './dto/link-management.dto';
import { VersionedUri, LinkChange } from './interfaces/versioned-uri.interface';
import { LinkResponse } from '../link-resolution/interfaces/uri.interface';
import { constructLinkSetJson } from './utils/link-set.utils';
import { getObjectName } from './utils/link-registration.utils';
import { convertAICode } from '../shared/utils/uri.utils';
import {
  createVersionHistoryEntry,
  normaliseDocument,
} from './utils/version.utils';
import {
  readLinkIndex,
  writeLinkIndex,
  deleteLinkIndex,
} from './utils/link-index.utils';
import { recalculateDefaultFlags } from './utils/default-flags.utils';
import {
  buildResponseKey,
  buildHistoricalKeys,
  formatResponseIdentity,
} from './utils/upsert.utils';

/**
 * Service responsible for managing individual links within existing identifier documents.
 * Provides CRUD operations on individual link responses with version tracking.
 */
@Injectable()
export class LinkManagementService {
  private readonly logger = new Logger(LinkManagementService.name);

  constructor(
    @Inject('RepositoryProvider')
    private readonly repositoryProvider: IRepositoryProvider,
    @Inject()
    private readonly identifierManagementService: IdentifierManagementService,
    private configService: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Resolves identifier configuration (AI code, resolver domain, etc.).
   */
  private async resolveIdentifierConfig(
    namespace: string,
    identificationKeyType: string,
  ) {
    const identifier =
      await this.identifierManagementService.getIdentifier(namespace);
    if (!identifier) {
      throw new GeneralErrorException(this.i18n, HttpStatus.NOT_FOUND, {
        key: 'namespace_not_found',
        args: { namespace },
      });
    }

    const aiCode = convertAICode(
      identificationKeyType,
      identifier.applicationIdentifiers,
    );
    if (!aiCode) {
      throw new GeneralErrorException(this.i18n, HttpStatus.BAD_REQUEST, {
        key: 'ai_code_not_found',
        args: { identificationKeyType },
      });
    }

    const resolverDomain = this.configService.get<string>('RESOLVER_DOMAIN');
    if (!resolverDomain) {
      throw new GeneralErrorException(
        this.i18n,
        HttpStatus.INTERNAL_SERVER_ERROR,
        { key: 'resolver_domain_not_configured' },
      );
    }

    const linkTypeVocDomain = identifier.namespaceURI
      ? identifier.namespaceURI
      : resolverDomain + '/voc';
    return { aiCode, resolverDomain, linkTypeVocDomain };
  }

  /**
   * Reconstructs linkset from a document.
   * Used after any mutation to keep the stored linkset in sync.
   */
  private reconstructLinkset(
    doc: VersionedUri,
    aiCode: string,
    attrs: { resolverDomain: string; linkTypeVocDomain: string },
  ): void {
    const activeResponses = doc.responses.filter((r) => r.active !== false);
    const payload: CreateLinkRegistrationDto = {
      namespace: doc.namespace,
      identificationKeyType: doc.identificationKeyType,
      identificationKey: doc.identificationKey,
      itemDescription: doc.itemDescription,
      qualifierPath: doc.qualifierPath,
      active: doc.active,
      responses: activeResponses as Response[],
    };
    doc.linkset = constructLinkSetJson(
      payload,
      aiCode,
      attrs,
      doc.versionHistory,
    );
  }

  /**
   * Resolves a linkId to its parent document path via the index.
   */
  private async resolveDocumentPath(linkId: string): Promise<string> {
    const documentPath = await readLinkIndex(this.repositoryProvider, linkId);
    if (!documentPath) {
      throw new GeneralErrorException(this.i18n, HttpStatus.NOT_FOUND, {
        key: 'link_index_not_found',
        args: { linkId },
      });
    }
    return documentPath;
  }

  /**
   * Fetches and normalises a document from storage.
   * Persists the normalised document if missing fields were filled in
   * (e.g., linkIds generated for legacy responses).
   */
  private async fetchDocument(documentPath: string): Promise<VersionedUri> {
    const raw = await this.repositoryProvider.one<any>(documentPath);
    if (!raw) {
      throw new GeneralErrorException(this.i18n, HttpStatus.NOT_FOUND, {
        key: 'identifier_document_not_found',
      });
    }

    const needsPersist =
      raw.version == null ||
      !Array.isArray(raw.responses) ||
      raw.responses.some((r: any) => !r.linkId);

    const doc = normaliseDocument(raw) as VersionedUri;

    if (needsPersist) {
      try {
        await this.repositoryProvider.save({ ...doc, id: documentPath });
        this.logger.log(`Persisted normalised document: ${documentPath}`);
      } catch (error) {
        this.logger.warn(
          `Failed to persist normalised document: ${documentPath}. Will retry on next write.`,
          error instanceof Error ? error.stack : error,
        );
        // Continue with the in-memory normalised document — a read should not fail because of a write-behind
      }

      // Write link index entries for any newly generated linkIds
      for (const response of doc.responses) {
        if (response.linkId) {
          try {
            await writeLinkIndex(
              this.repositoryProvider,
              response.linkId,
              documentPath,
            );
          } catch (error) {
            this.logger.warn(
              `Failed to write link index for linkId=${response.linkId}. Index may be out of sync.`,
              error instanceof Error ? error.stack : error,
            );
          }
        }
      }
    }

    return doc;
  }

  /**
   * Finds a response by linkId within a document or throws NOT_FOUND.
   */
  private findResponseOrThrow(doc: VersionedUri, linkId: string): LinkResponse {
    const response = doc.responses.find((r) => r.linkId === linkId);
    if (!response) {
      throw new GeneralErrorException(this.i18n, HttpStatus.NOT_FOUND, {
        key: 'link_not_found',
        args: { linkId },
      });
    }
    return response;
  }

  /**
   * Recalculates defaults, bumps version, records history, reconstructs
   * the linkset, and persists the document.
   */
  private async commitDocumentChanges(
    doc: VersionedUri,
    documentPath: string,
    changes: LinkChange[],
  ): Promise<void> {
    const now = new Date().toISOString();
    recalculateDefaultFlags(doc.responses);

    doc.version += 1;
    doc.updatedAt = now;
    doc.versionHistory.unshift(
      createVersionHistoryEntry(doc.version, changes, now),
    );

    const { aiCode, resolverDomain, linkTypeVocDomain } =
      await this.resolveIdentifierConfig(
        doc.namespace,
        doc.identificationKeyType,
      );
    this.reconstructLinkset(doc, aiCode, { resolverDomain, linkTypeVocDomain });
    await this.repositoryProvider.save({ ...doc, id: documentPath });
  }

  /**
   * Translates a success message key and returns it as a message object.
   */
  private translateSuccess(key: string): { message: string } {
    return { message: this.i18n.translate(`successes.${key}`) as string };
  }

  /**
   * Lists all links for an identifier.
   */
  async listLinks(query: ListLinksQueryDto): Promise<LinkResponse[]> {
    const { aiCode } = await this.resolveIdentifierConfig(
      query.namespace,
      query.identificationKeyType,
    );
    const objectName = getObjectName(query as any, aiCode);
    const doc = await this.fetchDocument(objectName);

    let responses = doc.responses;
    if (query.linkType) {
      responses = responses.filter((r) => r.linkType === query.linkType);
    }
    if (query.mimeType) {
      responses = responses.filter((r) => r.mimeType === query.mimeType);
    }
    if (query.ianaLanguage) {
      responses = responses.filter(
        (r) => r.ianaLanguage === query.ianaLanguage,
      );
    }
    return responses;
  }

  /**
   * Gets a single link by linkId.
   */
  async getLink(linkId: string): Promise<LinkResponse> {
    const documentPath = await this.resolveDocumentPath(linkId);
    const doc = await this.fetchDocument(documentPath);
    return this.findResponseOrThrow(doc, linkId);
  }

  /**
   * Updates a specific link by linkId.
   */
  async updateLink(
    linkId: string,
    dto: UpdateLinkDto,
  ): Promise<{ message: string }> {
    const updateFields = Object.keys(dto).filter(
      (key) => dto[key] !== undefined,
    );
    if (updateFields.length === 0) {
      throw new GeneralErrorException(this.i18n, HttpStatus.BAD_REQUEST, {
        key: 'empty_update_body',
      });
    }

    const documentPath = await this.resolveDocumentPath(linkId);
    const doc = await this.fetchDocument(documentPath);
    const existingResponse = this.findResponseOrThrow(doc, linkId);

    const change: LinkChange = { linkId, action: 'updated' };
    if (dto.targetUrl && dto.targetUrl !== existingResponse.targetUrl) {
      change.previousTargetUrl = existingResponse.targetUrl;
    }
    if (dto.linkType && dto.linkType !== existingResponse.linkType) {
      change.previousLinkType = existingResponse.linkType;
    }
    if (dto.mimeType && dto.mimeType !== existingResponse.mimeType) {
      change.previousMimeType = existingResponse.mimeType;
    }
    if (
      dto.ianaLanguage &&
      dto.ianaLanguage !== existingResponse.ianaLanguage
    ) {
      change.previousIanaLanguage = existingResponse.ianaLanguage;
    }
    if (dto.context && dto.context !== existingResponse.context) {
      change.previousContext = existingResponse.context;
    }

    // Apply updates — only override fields that are provided in the request body
    const PROTECTED_FIELDS = new Set(['linkId', 'createdAt', 'updatedAt']);
    for (const key of Object.keys(dto)) {
      if (dto[key] !== undefined && !PROTECTED_FIELDS.has(key)) {
        (existingResponse as any)[key] = dto[key];
      }
    }
    existingResponse.updatedAt = new Date().toISOString();

    // Check the updated response doesn't conflict with other responses or history
    const updatedKey = buildResponseKey(existingResponse as Response);
    const otherResponses = doc.responses.filter((r) => r.linkId !== linkId);
    const conflictingKeys = new Set(
      otherResponses.map((r) => buildResponseKey(r as Response)),
    );

    // Use ALL responses for historical key lookup — includes own history
    const historicalKeys = buildHistoricalKeys(
      doc.responses as Response[],
      doc.versionHistory,
    );
    for (const key of historicalKeys) {
      conflictingKeys.add(key);
    }

    if (conflictingKeys.has(updatedKey)) {
      throw new ConflictException(
        `Update would conflict with an existing response: ${formatResponseIdentity(existingResponse as Response)}`,
      );
    }

    await this.commitDocumentChanges(doc, documentPath, [change]);
    this.logger.log(
      `Link updated: linkId=${linkId}, fields=${updateFields.join(',')}`,
    );
    return this.translateSuccess('link_updated_successfully');
  }

  /**
   * Soft-deletes a link (sets active to false).
   */
  async softDeleteLink(linkId: string): Promise<{ message: string }> {
    const documentPath = await this.resolveDocumentPath(linkId);
    const doc = await this.fetchDocument(documentPath);
    const response = this.findResponseOrThrow(doc, linkId);

    response.active = false;
    response.updatedAt = new Date().toISOString();

    await this.commitDocumentChanges(doc, documentPath, [
      { linkId, action: 'soft_deleted' },
    ]);
    this.logger.log(`Link soft-deleted: linkId=${linkId}`);
    return this.translateSuccess('link_deleted_successfully');
  }

  /**
   * Hard-deletes a link (permanently removes it from the document).
   */
  async hardDeleteLink(linkId: string): Promise<{ message: string }> {
    const documentPath = await this.resolveDocumentPath(linkId);
    const doc = await this.fetchDocument(documentPath);
    const responseIndex = doc.responses.findIndex((r) => r.linkId === linkId);
    if (responseIndex === -1) {
      throw new GeneralErrorException(this.i18n, HttpStatus.NOT_FOUND, {
        key: 'link_not_found',
        args: { linkId },
      });
    }

    doc.responses.splice(responseIndex, 1);
    await this.commitDocumentChanges(doc, documentPath, [
      { linkId, action: 'hard_deleted' },
    ]);

    try {
      await deleteLinkIndex(this.repositoryProvider, linkId);
    } catch (error) {
      this.logger.error(
        `Failed to delete link index for linkId=${linkId}. Orphaned index entry may remain.`,
        error instanceof Error ? error.stack : error,
      );
    }

    this.logger.log(`Link hard-deleted: linkId=${linkId}`);
    return this.translateSuccess('link_deleted_successfully');
  }
}
