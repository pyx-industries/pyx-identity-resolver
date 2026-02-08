import { Inject, Injectable, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { CreateLinkRegistrationDto } from './dto/link-registration.dto';
import { IRepositoryProvider } from '../../repository/providers/provider.repository.interface';
import { constructLinkSetJson } from './utils/link-set.utils';
import { IdentifierManagementService } from '../identifier-management/identifier-management.service';
import { convertAICode } from '../shared/utils/uri.utils';
import { ConfigService } from '@nestjs/config';
import { getObjectName } from './utils/link-registration.utils';
import {
  generateLinkId,
  createVersionHistoryEntry,
} from './utils/version.utils';
import { writeLinkIndex } from './utils/link-index.utils';

@Injectable()
/**
 * Service responsible for creating new registrations and validating registration payloads.
 */
export class LinkRegistrationService {
  private readonly logger = new Logger(LinkRegistrationService.name);

  constructor(
    @Inject('RepositoryProvider')
    private readonly repositoryProvider: IRepositoryProvider,
    @Inject()
    private readonly identifierManagementService: IdentifierManagementService,
    private configService: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Creates a new registration using the provided payload.
   * @param payload - The registration data.
   * @returns A message indicating the success of the operation.
   */
  async create(
    payload: CreateLinkRegistrationDto,
  ): Promise<{ message: string }> {
    // Get the identifier for the namespace
    const identifier = await this.identifierManagementService.getIdentifier(
      payload.namespace,
    );
    const applicationIdentifiers = identifier.applicationIdentifiers;
    const aiCode = convertAICode(
      payload.identificationKeyType,
      applicationIdentifiers,
    );
    const objectName = getObjectName(payload, aiCode);

    const now = new Date().toISOString();

    // Determine version (increment if existing document, otherwise 1)
    const existingDoc = await this.repositoryProvider.one<any>(objectName);
    const version = existingDoc?.version != null ? existingDoc.version + 1 : 1;
    const createdAt = existingDoc?.createdAt || now;

    // Only assign linkIds to NEW responses (those without one)
    const newLinkIds: string[] = [];
    payload.responses.forEach((response: any) => {
      if (!response.linkId) {
        response.linkId = generateLinkId();
        response.createdAt = now;
        newLinkIds.push(response.linkId);
      }
      response.updatedAt = now;
    });

    // Record version history for additive operations
    const versionHistory = existingDoc?.versionHistory || [];
    if (existingDoc) {
      const changes = newLinkIds.map((linkId) => ({
        linkId,
        action: 'created' as const,
      }));
      if (changes.length > 0) {
        versionHistory.unshift(
          createVersionHistoryEntry(version, changes, now),
        );
      }
    }

    // Construct link set and link header text
    const resolverDomain = this.configService.get<string>('RESOLVER_DOMAIN');
    const linkTypeVocDomain =
      identifier.namespaceURI && identifier.namespaceURI !== ''
        ? identifier.namespaceURI
        : resolverDomain + '/voc';

    if (!resolverDomain) {
      throw new Error('Missing configuration for RESOLVER_DOMAIN');
    }
    if (!linkTypeVocDomain) {
      throw new Error('Missing configuration for LINK_TYPE_VOC_DOMAIN');
    }
    const activePayload = {
      ...payload,
      responses: payload.responses.filter((r) => r.active !== false),
    };
    const linkset = constructLinkSetJson(
      activePayload,
      aiCode,
      { resolverDomain, linkTypeVocDomain },
      versionHistory,
    );
    await this.repositoryProvider.save({
      ...payload,
      id: objectName,
      createdAt,
      updatedAt: now,
      version,
      versionHistory,
      linkset,
    });

    // Write linkId index entries only for NEW responses
    for (const response of payload.responses) {
      if (newLinkIds.includes(response.linkId)) {
        await writeLinkIndex(
          this.repositoryProvider,
          response.linkId,
          objectName,
        );
      }
    }

    const translatedMessage = this.i18n.translate(
      'successes.register_link_resolver_successfully',
    );
    return { message: translatedMessage };
  }

  async one(id: string): Promise<CreateLinkRegistrationDto> {
    return this.repositoryProvider.one(id);
  }
}
