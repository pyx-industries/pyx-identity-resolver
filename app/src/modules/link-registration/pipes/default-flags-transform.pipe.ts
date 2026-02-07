import { PipeTransform } from '@nestjs/common';
import { CreateLinkRegistrationDto } from '../dto/link-registration.dto';
import { recalculateDefaultFlags } from '../utils/default-flags.utils';
import { LinkResponse } from '../../link-resolution/interfaces/uri.interface';

/**
 * Pipe that ensures exactly one active response has each default flag set
 * to true within its scope.
 *
 * Delegates to recalculateDefaultFlags which:
 * - Clears default flags on inactive responses
 * - Deduplicates: when multiple active responses claim a default in the
 *   same scope, the last one in array order wins
 * - Promotes: when no active response in a scope has a default, the first
 *   active response in that scope is promoted
 *
 * Scope definitions:
 * - defaultLinkType: entire registration (global)
 * - defaultIanaLanguage: per linkType
 * - defaultContext: per linkType + ianaLanguage
 * - defaultMimeType: per linkType + ianaLanguage + context
 */
export class DefaultFlagsTransformPipe
  implements
    PipeTransform<CreateLinkRegistrationDto, CreateLinkRegistrationDto>
{
  transform(value: CreateLinkRegistrationDto): CreateLinkRegistrationDto {
    if (value.responses?.length) {
      recalculateDefaultFlags(value.responses as LinkResponse[]);
    }
    return value;
  }
}
