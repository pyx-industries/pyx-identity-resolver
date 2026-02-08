import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LinkResolutionDto } from './dto/link-resolution.dto';
import { IRepositoryProvider } from '../../repository/providers/provider.repository.interface';
import { constructID, convertAICode } from '../shared/utils/uri.utils';
import { Uri } from './interfaces/uri.interface';
import {
  processUri,
  LinksetReconstructionContext,
} from './utils/link-resolution.utils';
import { filterByAccessRole } from './utils/access-role-filter.utils';
import { GeneralErrorException } from '../../common/exceptions/general-error.exception';
import { I18nService } from 'nestjs-i18n';
import { ResolvedLink } from './interfaces/link-resolution.interface';
import { IdentifierManagementService } from '../identifier-management/identifier-management.service';
import { ApplicationIdentifier } from '../identifier-management/dto/identifier.dto';

@Injectable()
export class LinkResolutionService {
  constructor(
    @Inject('RepositoryProvider')
    private readonly repositoryProvider: IRepositoryProvider,
    @Inject()
    private readonly identifierManagementService: IdentifierManagementService,
    private readonly i18n: I18nService,
    private readonly configService: ConfigService,
  ) {}

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

      let effectiveUri = uriWithId;
      let reconstructionContext: LinksetReconstructionContext | undefined;

      if (accessRole) {
        effectiveUri = {
          ...uriWithId,
          responses: filterByAccessRole(uriWithId.responses, accessRole),
        };

        const resolverDomain =
          this.configService.getOrThrow<string>('RESOLVER_DOMAIN');
        const linkTypeVocDomain =
          identifier.namespaceURI && identifier.namespaceURI !== ''
            ? identifier.namespaceURI
            : resolverDomain + '/voc';

        reconstructionContext = {
          identificationKeyCode:
            standardizedParams.identifiers.primary.qualifier,
          resolverDomain,
          linkTypeVocDomain,
        };
      }

      const resolvedLink = processUri(
        effectiveUri,
        standardizedParams,
        reconstructionContext,
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
