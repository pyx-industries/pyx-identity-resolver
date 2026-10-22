import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildApiBaseUrl } from '../../common/utils/config.utils';
import { LinkResolutionDto } from './dto/link-resolution.dto';
import { IRepositoryProvider } from '../../repository/providers/provider.repository.interface';
import { constructID, convertAICode } from '../shared/utils/uri.utils';
import { Uri } from './interfaces/uri.interface';
import { processUri } from './utils/link-resolution.utils';
import { filterByAccessRole } from './utils/access-role-filter.utils';
import { normaliseDocument } from '../link-registration/utils/version.utils';
import { GeneralErrorException } from '../../common/exceptions/general-error.exception';
import { I18nService } from 'nestjs-i18n';
import {
  ResolvedLink,
  ResolutionContext,
} from './interfaces/link-resolution.interface';
import { IdentifierManagementService } from '../identifier-management/identifier-management.service';
import { ApplicationIdentifier } from '../identifier-management/dto/identifier.dto';

/**
 * Default response header limit of Node.js HTTP clients, including `fetch`
 * (`http.maxHeaderSize`, 16 KiB). It covers every response header combined,
 * so a `Link` header budget at or above it fails those clients with
 * `UND_ERR_HEADERS_OVERFLOW` whenever an identifier fills the budget.
 */
export const COMMON_CLIENT_HEADER_LIMIT = 16384;

@Injectable()
export class LinkResolutionService {
  private readonly logger = new Logger(LinkResolutionService.name);
  private readonly linkHeaderMaxSize: number;

  constructor(
    @Inject('RepositoryProvider')
    private readonly repositoryProvider: IRepositoryProvider,
    @Inject()
    private readonly identifierManagementService: IdentifierManagementService,
    private readonly i18n: I18nService,
    private readonly configService: ConfigService,
  ) {
    const rawMaxSize = this.configService.get<string>(
      'LINK_HEADER_MAX_SIZE',
      '8192',
    );
    if (!/^\d+$/.test(rawMaxSize)) {
      throw new Error(
        `Invalid LINK_HEADER_MAX_SIZE configuration: '${rawMaxSize}'. Must be a positive integer (digits only).`,
      );
    }
    const parsed = parseInt(rawMaxSize, 10);
    if (parsed <= 0) {
      throw new Error(
        `Invalid LINK_HEADER_MAX_SIZE configuration: '${rawMaxSize}'. Must be greater than 0.`,
      );
    }
    if (parsed >= COMMON_CLIENT_HEADER_LIMIT) {
      this.logger.warn(
        `LINK_HEADER_MAX_SIZE (${parsed} bytes) is at or above ${COMMON_CLIENT_HEADER_LIMIT} bytes, ` +
          `the default limit Node.js HTTP clients (including fetch) apply to all response headers combined. ` +
          `Resolutions for identifiers that fill the budget will fail for those clients. ` +
          `Every link stays available from the linkset.`,
      );
    }
    this.linkHeaderMaxSize = parsed;
  }

  async resolve(identifierParams: LinkResolutionDto): Promise<ResolvedLink> {
    const identifier = await this.identifierManagementService.getIdentifier(
      identifierParams.namespace,
    );
    const allIdentifiers = identifier.applicationIdentifiers;

    const standardizedParams = this.standardizeLinkResolutionDto(
      identifierParams,
      allIdentifiers,
    );

    const id = constructID(standardizedParams);
    const raw = await this.repositoryProvider.one(id);
    const uriWithId: Uri | null = raw ? (normaliseDocument(raw) as Uri) : null;

    if (uriWithId && uriWithId.active) {
      const accessRole = identifierParams.descriptiveAttributes?.accessRole;

      // Progressive cleanup: strip stale linkHeaderText field from documents
      // written before query-time header construction was introduced. This
      // cleanup can be removed once all documents have been accessed at least
      // once, or via a migration script.
      if ((uriWithId as any).linkHeaderText !== undefined) {
        const cleanedDoc = { ...uriWithId, id };
        delete (cleanedDoc as any).linkHeaderText;
        this.repositoryProvider.save(cleanedDoc).catch((err) => {
          this.logger.warn(
            `Failed to strip stale linkHeaderText from document: ${id}`,
            err instanceof Error ? err.stack : err,
          );
        });
      }

      let effectiveUri = uriWithId;
      if (accessRole) {
        effectiveUri = {
          ...uriWithId,
          responses: filterByAccessRole(uriWithId.responses, accessRole),
        };
      }

      const apiBaseUrl = buildApiBaseUrl(this.configService);
      const linkTypeVocDomain =
        identifier.namespaceURI && identifier.namespaceURI !== ''
          ? identifier.namespaceURI
          : `${apiBaseUrl}/voc`;

      const context: ResolutionContext = {
        identificationKeyCode: standardizedParams.identifiers.primary.qualifier,
        resolverDomain: apiBaseUrl,
        linkTypeVocDomain,
        namespace: standardizedParams.namespace,
        identificationKey: standardizedParams.identifiers.primary.id,
        qualifierPath: uriWithId.qualifierPath,
        linkType: identifierParams.descriptiveAttributes?.linkType,
        accessRole,
        linkHeaderMaxSize: this.linkHeaderMaxSize,
      };

      const resolvedLink = processUri(
        effectiveUri,
        standardizedParams,
        context,
      );
      if (resolvedLink) {
        return resolvedLink;
      }
    }

    throw new GeneralErrorException(this.i18n, HttpStatus.NOT_FOUND, {
      key: 'cannot_resolve_link',
    });
  }

  private standardizeLinkResolutionDto(
    identifierParams: LinkResolutionDto,
    allIdentifiers: ApplicationIdentifier[],
  ) {
    const { namespace, identifiers, descriptiveAttributes } = identifierParams;
    const { primary, secondaries = [] } = identifiers;

    return {
      namespace,
      identifiers: {
        primary: {
          qualifier: convertAICode(primary.qualifier, allIdentifiers),
          id: primary.id,
        },
        secondaries: secondaries.map((secondary) => ({
          qualifier: convertAICode(secondary.qualifier, allIdentifiers),
          id: secondary.id,
        })),
      },
      descriptiveAttributes,
    };
  }
}
