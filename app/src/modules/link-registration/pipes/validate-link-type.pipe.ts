import { HttpStatus, Injectable, PipeTransform } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

import { CreateLinkRegistrationDto } from '../dto/link-registration.dto';
import { FieldErrorsException } from '../../../common/exceptions/field-errors.exception';
import { gs1LinkTypes } from '../constants/gs1-link-types';
import { untpLinkTypes } from '../constants/untp-link-types';

const LINK_TYPE_REGISTRIES: Record<string, Record<string, unknown>> = {
  gs1: gs1LinkTypes,
  untp: untpLinkTypes,
};

@Injectable()
export class ValidateLinkTypePipe implements PipeTransform {
  constructor(private readonly i18n: I18nService) {}

  /**
   * Validates the link type in the request against the correct vocabulary
   * for its prefix. Link types must use a prefix:key format (e.g. gs1:pip, untp:dpp).
   * The prefix must be a registered vocabulary and the key must exist within it.
   * @param value - The request payload.
   * @throws FieldErrorsException if the prefix is unknown or the key is not registered.
   * @returns The request payload.
   */
  async transform(value: CreateLinkRegistrationDto) {
    const { responses } = value;

    for (const response of responses) {
      if (!response.linkType.includes(':')) {
        throw new FieldErrorsException(this.i18n, HttpStatus.NOT_FOUND, [
          {
            field: 'linkType',
            errorProperties: {
              key: 'invalid_link_type',
              args: { linkType: response.linkType },
            },
          },
        ]);
      }

      const [prefix, linkTypeKey] = response.linkType.split(':');
      const registry = LINK_TYPE_REGISTRIES[prefix];

      if (!registry) {
        throw new FieldErrorsException(this.i18n, HttpStatus.NOT_FOUND, [
          {
            field: 'linkType',
            errorProperties: {
              key: 'invalid_namespace_prefix',
              args: {
                prefix,
                namespace: Object.keys(LINK_TYPE_REGISTRIES).join(', '),
              },
            },
          },
        ]);
      }

      if (!(linkTypeKey in registry)) {
        throw new FieldErrorsException(this.i18n, HttpStatus.NOT_FOUND, [
          {
            field: 'linkType',
            errorProperties: {
              key: 'invalid_link_type',
              args: { linkType: response.linkType },
            },
          },
        ]);
      }
    }

    return value;
  }
}
