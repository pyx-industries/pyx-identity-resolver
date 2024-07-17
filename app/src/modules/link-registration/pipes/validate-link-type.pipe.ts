import { lastValueFrom } from 'rxjs';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { HttpService } from '@nestjs/axios';

import { CreateLinkRegistrationDto } from '../dto/link-registration.dto';
import { IdentifierManagementService } from '../../identifier-management/identifier-management.service';
import { FieldErrorsException } from '../../../common/exceptions/field-errors.exception';

@Injectable()
export class ValidateLinkTypePipe implements PipeTransform {
  constructor(
    private readonly httpService: HttpService,
    private readonly identifierManagementService: IdentifierManagementService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Validates the link type in the request.
   * @param value - The request payload.
   * @throws BadRequestException if the link type is invalid.
   * @returns The request payload.
   */
  async transform(value: CreateLinkRegistrationDto) {
    const { namespace, responses } = value;

    const namespaceProfile = await this.loadNamespaceProfile(namespace);

    // Validate each link type in the request
    for (const response of responses) {
      const [prefix, linkTypeKey] = response.linkType.split(':');

      // Ensure the prefix matches the namespace
      if (prefix !== namespace) {
        throw new FieldErrorsException(this.i18n, HttpStatus.NOT_FOUND, [
          {
            field: 'linkType',
            errorProperties: {
              key: 'invalid_namespace_prefix',
              args: { prefix, namespace },
            },
          },
        ]);
      }

      if (!this.isLinkTypeValid(namespaceProfile, linkTypeKey)) {
        throw new FieldErrorsException(this.i18n, HttpStatus.NOT_FOUND, [
          {
            field: 'linkType',
            errorProperties: {
              key: 'invalid_link_type',
              args: { linkType: linkTypeKey },
            },
          },
        ]);
      }
    }

    return value;
  }

  private async loadNamespaceProfile(namespace: string) {
    try {
      const profile =
        await this.identifierManagementService.getIdentifier(namespace);

      if (profile && !profile.namespaceProfile) {
        profile.namespaceProfile = `${process.env.RESOLVER_DOMAIN}/voc/?show=linktypes`;
      }

      // The HttpService provided by HttpModule is built on top of axios but returns Observables instead of Promises.
      // lastValueFrom is used to convert an Observable into a Promise.
      const response = await lastValueFrom(
        this.httpService.get(profile.namespaceProfile),
      );

      if (response.status !== 200) {
        throw new BadRequestException('Failed to load namespace profile');
      }

      // Check if the data is a valid JSON object
      if (typeof response.data !== 'object' || response.data === null) {
        throw new BadRequestException('Invalid JSON data in namespace profile');
      }

      return response.data;
    } catch (error) {
      throw new BadRequestException('Failed to load namespace profile');
    }
  }

  private isLinkTypeValid(resolverDescription: any, linkType: string): boolean {
    // Check if the linkType exists as a key after loading the namespace profile
    return Object.prototype.hasOwnProperty.call(resolverDescription, linkType);
  }
}
