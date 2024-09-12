import { Inject, PipeTransform } from '@nestjs/common';
import { IdentifierDto } from '../dto/identifier.dto';
import { IdentifierManagementService } from '../identifier-management.service';
import { processEntryIdentifierData } from '../utils/upsert.utils';

/**
 * Pipe used to combine the incoming data with the existing data.
 */
export class IdentifierTransformPipe
  implements PipeTransform<IdentifierDto, Promise<IdentifierDto>>
{
  constructor(
    @Inject()
    private readonly identifierManagementService: IdentifierManagementService,
  ) {}

  async transform(value: IdentifierDto): Promise<IdentifierDto> {
    const existingIdentifier =
      await this.identifierManagementService.getIdentifier(value.namespace);

    const updatedIdentifier = processEntryIdentifierData(
      existingIdentifier,
      value,
    );

    return updatedIdentifier;
  }
}
