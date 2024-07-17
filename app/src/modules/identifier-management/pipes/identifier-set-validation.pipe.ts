import { HttpStatus, Inject, PipeTransform } from '@nestjs/common';
import { FieldError } from '../../../common/dto/errors.dto';
import { ErrorCollector } from '../../../common/utils/errors.utils';
import { validateIdentifierQualifiersSetFactory } from '../factories/identifier-validation.factories';
import { I18nService } from 'nestjs-i18n';
import { IdentifierManagementService } from '../identifier-management.service';
import { FieldErrorsException } from '../../../common/exceptions/field-errors.exception';
import { IdentifierParameters } from '../interfaces/identifier.interface';
import { CreateLinkRegistrationDto } from '../../link-registration/dto/link-registration.dto';
import { LinkResolutionDto } from '../../link-resolution/dto/link-resolution.dto';
import {
  constructIdentifierParametersFromCreateLinkRegistrationDto,
  constructIdentifierParametersFromLinkResolutionDto,
} from '../../shared/utils/uri.utils';

export class IdentifierSetValidationPipe
  implements
    PipeTransform<CreateLinkRegistrationDto | LinkResolutionDto, Promise<any>>
{
  constructor(
    @Inject() private readonly i18n: I18nService,
    @Inject()
    private readonly identifierManagementService: IdentifierManagementService,
  ) {}

  async transform(
    value: CreateLinkRegistrationDto | LinkResolutionDto,
  ): Promise<any> {
    try {
      const errorCollector = new ErrorCollector<FieldError>();

      if ('identifiers' in value) {
        await this.validateIdentifiers(
          constructIdentifierParametersFromLinkResolutionDto(
            value as LinkResolutionDto,
          ),
          errorCollector,
        );
      }

      if ('identificationKeyType' in value) {
        await this.validateIdentifiers(
          constructIdentifierParametersFromCreateLinkRegistrationDto(
            value as CreateLinkRegistrationDto,
          ),
          errorCollector,
        );
      }

      // If there are errors, translate and throw them
      if (errorCollector.hasErrors()) {
        throw new FieldErrorsException(
          this.i18n,
          HttpStatus.BAD_REQUEST,
          errorCollector.getErrors(),
        );
      }

      return value;
    } catch (error) {
      throw error;
    }
  }

  private async validateIdentifiers(
    params: IdentifierParameters,
    errorCollector: ErrorCollector<FieldError>,
  ) {
    const identifier = await this.identifierManagementService.getIdentifier(
      params.namespace,
    );

    if (!identifier) {
      throw new FieldErrorsException(this.i18n, HttpStatus.NOT_FOUND, [
        {
          field: 'namespace',
          errorProperties: {
            key: 'identifier_not_found',
            args: { namespace: params.namespace },
          },
        },
      ]);
    }

    validateIdentifierQualifiersSetFactory(
      params,
      identifier.applicationIdentifiers,
      errorCollector,
    );
  }
}
