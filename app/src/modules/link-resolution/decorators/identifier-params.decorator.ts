import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import Negotiator from 'negotiator';
import { LinkResolutionDto } from '../dto/link-resolution.dto';
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

      const wildCardPath = request.params['0'] || secondaryIdentifiersPath;
      const negotiator = new Negotiator(request);

      const mimeTypes = negotiator.mediaTypes();
      const hreflangPreferences = negotiator.languages();

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
          ...request.query,
          mimeTypes,
          hreflangPreferences,
        },
      };
      return parameters;
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Invalid request data');
    }
  },
);
