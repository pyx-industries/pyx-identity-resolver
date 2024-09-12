import { Inject, PipeTransform } from '@nestjs/common';
import { CreateLinkRegistrationDto } from '../dto/link-registration.dto';
import { LinkRegistrationService } from '../link-registration.service';
import { getObjectName } from '../utils/link-registration.utils';
import { convertAICode } from '../../shared/utils/uri.utils';
import { IdentifierManagementService } from '../../identifier-management/identifier-management.service';
import { processEntryLinkRegistrationData } from '../utils/upsert.utils';

/**
 * Pipe used to combine the incoming data with the existing data.
 */
export class LinkRegistrationTransformPipe
  implements
    PipeTransform<
      CreateLinkRegistrationDto,
      Promise<CreateLinkRegistrationDto>
    >
{
  constructor(
    @Inject()
    private readonly linkRegistrationService: LinkRegistrationService,
    @Inject()
    private readonly identifierManagementService: IdentifierManagementService,
  ) {}

  async transform(
    value: CreateLinkRegistrationDto,
  ): Promise<CreateLinkRegistrationDto> {
    const identifier = await this.identifierManagementService.getIdentifier(
      value.namespace,
    );
    const applicationIdentifiers = identifier.applicationIdentifiers;
    const aiCode = convertAICode(
      value.identificationKeyType,
      applicationIdentifiers,
    );

    const objectName = getObjectName(value, aiCode);
    const existingLinkRegistration =
      await this.linkRegistrationService.one(objectName);

    const updatedLinkRegistration = processEntryLinkRegistrationData(
      existingLinkRegistration,
      value,
    );

    return updatedLinkRegistration;
  }
}
