import { PipeTransform, Injectable, Inject, HttpStatus } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { GeneralErrorException } from '../../../common/exceptions/general-error.exception';
import { IdentifierManagementService } from '../identifier-management.service';

@Injectable()
export class IdentifierExistencePipe implements PipeTransform {
  private readonly identifierPath: string;

  constructor(
    @Inject(I18nService) private readonly i18n: I18nService,
    private readonly identifierManagementService: IdentifierManagementService,
  ) {}

  /**
   * Transforms and validates the identifier.
   * @param namespace - The identifier to validate.
   * @returns The validated identifier.
   * @throws BadRequestException if the identifier file does not exist.
   */
  async transform(namespace: string): Promise<any> {
    if (namespace) {
      const result =
        await this.identifierManagementService.getIdentifier(namespace);

      if (!result) {
        throw new GeneralErrorException(this.i18n, HttpStatus.BAD_REQUEST, {
          key: 'identifier_file_not_found',
          args: { namespace },
        });
      }
    }

    return namespace;
  }
}
