import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';

import {
  ResolverConfig,
  SupportedLinkType,
} from './interface/common.interface';
import { IdentifierManagementService } from '../identifier-management/identifier-management.service';
import { defaultLinkTypes } from './data/default-link-types';
import { GeneralErrorException } from '../../common/exceptions/general-error.exception';

@Injectable()
export class CommonService {
  constructor(
    private readonly configService: ConfigService,
    private readonly identifierService: IdentifierManagementService,
    private readonly i18n: I18nService,
  ) {}

  /*
   * This method transforms the data from the IdentifierService into the ResolverConfig object.
   * @returns A Promise that resolves to a ResolverConfig
   * Example:
   * {
   *    "name": "The IDR",
   *    "resolverRoot": "http://localhost:3000", // current host get from RESOLVER_DOMAIN in .env
   *    "supportedLinkType": [
   *        {
   *            "namespace": "http://gs1.org/voc/" | "http://localhost:3000/voc/", // get from namespaceURI or default current host
   *            "prefix": "gs1:", // get from namespace
   *            "profile": "https://www.gs1.org/voc/?show=linktypes" | "http://localhost:3000/voc/?show=linktypes" // get from namespaceProfile or default is the json of linkTypes in source code
   *        },
   *        {
   *            "namespace": "http://integrity-system.org/",
   *            "prefix": "integrity-system:",
   *            "profile": "http://integrity-system.org/?show=linktypes"
   *        }
   *    ]
   * }
   */
  async transformResolverData(): Promise<ResolverConfig> {
    const appName = this.configService.get('APP_NAME');
    if (!appName) {
      // TODO: refactor to use a custom exception
      throw new Error('APP_NAME is not defined');
    }

    const appEndpoint = this.configService.get('RESOLVER_DOMAIN');
    if (!appEndpoint) {
      // TODO: refactor to use a custom exception
      throw new Error('RESOLVER_DOMAIN is not defined');
    }

    return {
      name: this.configService.get('APP_NAME'),
      resolverRoot: this.configService.get('RESOLVER_DOMAIN'),
      supportedLinkType: await this.mapSupportedLinkTypes(),
      supportedPrimaryKeys: ['all'],
    };
  }

  private async mapSupportedLinkTypes(): Promise<SupportedLinkType[]> {
    const identifiers = await this.identifierService.getIdentifiers();
    return Object.keys(identifiers).map((key) => {
      return {
        namespace:
          identifiers[key].namespaceURI && identifiers[key].namespaceURI !== ''
            ? identifiers[key].namespaceURI
            : `${this.configService.get('RESOLVER_DOMAIN')}/voc/`,
        prefix: `${identifiers[key].namespace}:`,
        profile:
          identifiers[key].namespaceProfile &&
          identifiers[key].namespaceProfile !== ''
            ? identifiers[key].namespaceProfile
            : `${this.configService.get('RESOLVER_DOMAIN')}/voc/?show=linktypes`,
      };
    });
  }

  // Get the content of the JSON file
  getLinkTypes() {
    const defaultLinkTypesPath = defaultLinkTypes;
    return defaultLinkTypesPath;
  }

  getSpecificLinkType(linkType: string) {
    const linkTypes = this.getLinkTypes();
    if (!linkTypes[linkType]) {
      throw new GeneralErrorException(this.i18n, HttpStatus.BAD_REQUEST, {
        key: 'invalid_voc_linktype',
      });
    }
    return linkTypes[linkType];
  }
}
