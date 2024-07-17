import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import Negotiator from 'negotiator';
import { LinkResolutionDto } from '../dto/link-resolution.dto';
import { IanalanguageContext } from '../interfaces/link-resolution.interface';
import { constructQualifiersFromQualifierPath } from '../../shared/utils/uri.utils';

export const IdentifierParams = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    try {
      const request = ctx.switchToHttp().getRequest();
      const {
        namespace,
        identifierKeyType,
        identifierKey,
        secondaryIdentifiersPath,
      } = request.params;
      const query = request.query;

      const wildCardPath = request.params['0'] || secondaryIdentifiersPath;
      const negotiator = new Negotiator(request);

      const mimeTypes = negotiator.mediaTypes();

      const languageTags = negotiator.languages();
      const ianaLanguageContexts: IanalanguageContext[] = languageTags.map(
        (languageTag) => {
          const langTagArray = languageTag.split('-');
          const ianaLanguageContext = {
            ianaLanguage: langTagArray[0],
            context: 'xx',
          };

          // If the language tag has a region code, use it as the context value, otherwise use 'xx'
          if (langTagArray[1] && langTagArray[1].length === 2) {
            ianaLanguageContext.context = langTagArray[1];
          }
          return ianaLanguageContext;
        },
      );

      const parameters: LinkResolutionDto = {
        namespace,
        identifiers: {
          primary: {
            qualifier: identifierKeyType,
            id: identifierKey,
          },
          secondaries: constructQualifiersFromQualifierPath(wildCardPath),
        },
        descriptiveAttributes: {
          ...query,
          mimeTypes: mimeTypes,
          ianaLanguageContexts: ianaLanguageContexts,
        },
      };
      return parameters;
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Invalid request data');
    }
  },
);
