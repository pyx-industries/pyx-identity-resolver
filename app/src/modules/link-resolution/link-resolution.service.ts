import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LinkResolutionDto } from './dto/link-resolution.dto';
import { IRepositoryProvider } from '../../repository/providers/provider.repository.interface';
import { constructID, convertAICode } from '../shared/utils/uri.utils';
import { Uri } from './interfaces/uri.interface';
import { processUri } from './utils/link-resolution.utils';
import { filterByAccessRole } from './utils/access-role-filter.utils';
import { GeneralErrorException } from '../../common/exceptions/general-error.exception';
import { I18nService } from 'nestjs-i18n';
import {
  ResolvedLink,
  ResolutionContext,
} from './interfaces/link-resolution.interface';
import { IdentifierManagementService } from '../identifier-management/identifier-management.service';
import { ApplicationIdentifier } from '../identifier-management/dto/identifier.dto';

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
    const parsed = parseInt(rawMaxSize, 10);
    if (isNaN(parsed) || parsed <= 0) {
      throw new Error(
        `Invalid LINK_HEADER_MAX_SIZE configuration: '${rawMaxSize}'. Must be a positive integer.`,
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
    const uriWithId: Uri = await this.repositoryProvider.one(id);

    if (uriWithId && uriWithId.active) {
      const accessRole = identifierParams.descriptiveAttributes?.accessRole;

      // Progressive cleanup: strip stale linkHeaderText field
      if ((uriWithId as any).linkHeaderText !== undefined) {
        const cleanedDoc = { ...uriWithId, id };
        delete (cleanedDoc as any).linkHeaderText;
        this.repositoryProvider.save(cleanedDoc).catch((err) => {
          this.logger.error(
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

      const resolverDomain =
        this.configService.getOrThrow<string>('RESOLVER_DOMAIN');
      const linkTypeVocDomain =
        identifier.namespaceURI && identifier.namespaceURI !== ''
          ? identifier.namespaceURI
          : resolverDomain + '/voc';

      const context: ResolutionContext = {
        identificationKeyCode: standardizedParams.identifiers.primary.qualifier,
        resolverDomain,
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
