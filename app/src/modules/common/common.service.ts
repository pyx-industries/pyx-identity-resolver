import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';

import {
  ResolverConfig,
  SupportedLinkType,
} from './interface/common.interface';
import { gs1LinkTypes } from '../link-registration/constants/gs1-link-types';
import { untpLinkTypes } from '../link-registration/constants/untp-link-types';
import { GeneralErrorException } from '../../common/exceptions/general-error.exception';

@Injectable()
export class CommonService {
  constructor(
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  /*
   * Builds the resolver description for .well-known/resolver.
   * @returns A ResolverConfig with supported link type vocabularies (gs1, untp).
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
      supportedLinkType: this.mapSupportedLinkTypes(),
      supportedPrimaryKeys: ['all'],
    };
  }

  private mapSupportedLinkTypes(): SupportedLinkType[] {
    return [
      {
        namespace: 'http://gs1.org/voc/',
        prefix: 'gs1:',
        profile: `${this.configService.get('RESOLVER_DOMAIN')}/voc/?show=linktypes`,
      },
      {
        namespace: 'https://vocabulary.uncefact.org/untp/linkType#',
        prefix: 'untp:',
        profile: `${this.configService.get('RESOLVER_DOMAIN')}/voc/?show=linktypes`,
      },
    ];
  }

  getLinkTypes(prefix?: string): Record<string, Record<string, unknown>> {
    const all = {
      gs1: gs1LinkTypes,
      untp: untpLinkTypes,
    };

    if (!prefix) {
      return all;
    }

    return prefix in all ? { [prefix]: all[prefix] } : {};
  }

  getSpecificLinkType(linkType: string) {
    const registries = this.getLinkTypes();
    for (const registry of Object.values(registries)) {
      if (linkType in registry) {
        return registry[linkType];
      }
    }

    throw new GeneralErrorException(this.i18n, HttpStatus.BAD_REQUEST, {
      key: 'invalid_voc_linktype',
    });
  }
}
