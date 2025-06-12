import { LinkContextObject } from '../../link-registration/interfaces/link-set.interface';
import { LinkResolutionDto } from '../dto/link-resolution.dto';
import {
  IanalanguageContext,
  ResolvedLink,
} from '../interfaces/link-resolution.interface';
import { LinkResponse, Uri } from '../interfaces/uri.interface';

/**
 * Process the URI and return the appropriate response or linkset.
 *
 * @param uri
 * @param identifierParams
 * @returns LinkResponse | LinkContextObject | undefined
 */
export const processUri = (uri: Uri, identifierParams: LinkResolutionDto) => {
  if (identifierParams.descriptiveAttributes.linkType === 'all') {
    return processUriForLinkTypeAll(uri);
  } else {
    return processUriForSpecificLinkType(uri, identifierParams);
  }
};

/**
 * Process the URI and return the appropriate response.
 * The response is determined by the linkType, ianaLanguage, and mimeType with the following order of precedence:
 * 1. linkType, ianaLanguage, context, mimeType
 * 2. linkType, ianaLanguage, context, defaultMimeType
 * 3. linkType, ianaLanguage, context
 * 4. linkType, ianaLanguage, defaultContext
 * 5. linkType, ianaLanguage
 * 6. linkType, defaultIanaLanguage
 * 7. linkType
 * 8. defaultLinkType
 *
 * @param uri
 * @param identifierParams
 * @returns LinkResponse | undefined
 */
const processUriForSpecificLinkType = (
  uri: Uri,
  identifierParams: LinkResolutionDto,
): ResolvedLink | undefined => {
  const responses = uri.responses.filter((res) => res.active).reverse(); // Temporary fix so that IDR Link resolves to latest issued VC
  const {
    linkType,
    ianaLanguageContexts = [],
    mimeTypes = [],
  } = identifierParams.descriptiveAttributes;

  let response: LinkResponse;

  if (!linkType) {
    response = matchDefaultLinkType(responses);
  } else {
    response =
      matchLinkTypeLanguageContextMimeType(
        responses,
        linkType,
        ianaLanguageContexts,
        mimeTypes,
      ) ||
      matchLinkTypeLanguageContextDefaultMimeType(
        responses,
        linkType,
        ianaLanguageContexts,
      ) ||
      matchLinkTypeLanguageContext(responses, linkType, ianaLanguageContexts) ||
      matchLinkTypeLanguageDefaultContext(
        responses,
        linkType,
        ianaLanguageContexts,
      ) ||
      matchLinkTypeLanguage(responses, linkType, ianaLanguageContexts) ||
      matchLinkTypeDefaultLanguage(responses, linkType) ||
      matchLinkType(responses, linkType);
  }

  if (!response) {
    return undefined;
  }

  return constructResolvedLinkForResponse(
    response,
    uri.linkset,
    uri.linkHeaderText,
  );
};

/**
 * Process the URI when request linkType=all.
 *
 * @param uri
 * @param identifierParams
 * @returns LinkSet
 */
const processUriForLinkTypeAll = (uri: Uri) => {
  const { linkset } = uri;

  if (!linkset) {
    return undefined;
  }
  return constructResolvedLinkForLinkSet(linkset, uri.linkHeaderText);
};

const matchLinkTypeLanguageContextMimeType = (
  responses: LinkResponse[],
  linkType: string,
  ianaLanguageContexts: IanalanguageContext[],
  mimeTypes: string[],
): LinkResponse => {
  const response = responses.find((res) => {
    return (
      res.linkType === linkType &&
      checkIanaLanguageContext(res, ianaLanguageContexts) &&
      mimeTypes
        .map((mimeType) => mimeType.toLowerCase())
        .includes(res.mimeType.toLowerCase())
    );
  });
  return response;
};

const matchLinkTypeLanguageContextDefaultMimeType = (
  responses: LinkResponse[],
  linkType: string,
  ianaLanguageContexts: IanalanguageContext[],
): LinkResponse => {
  const response = responses.find(
    (res) =>
      res.linkType === linkType &&
      checkIanaLanguageContext(res, ianaLanguageContexts) &&
      res.defaultMimeType,
  );
  return response;
};

const matchLinkTypeLanguageContext = (
  responses: LinkResponse[],
  linkType: string,
  ianaLanguageContexts: IanalanguageContext[],
): LinkResponse => {
  const response = responses.find(
    (res) =>
      res.linkType === linkType &&
      checkIanaLanguageContext(res, ianaLanguageContexts),
  );
  return response;
};

const matchLinkTypeLanguageDefaultContext = (
  responses: LinkResponse[],
  linkType: string,
  ianaLanguageContexts: { ianaLanguage: string; context: string }[],
): LinkResponse => {
  const response = responses.find(
    (res) =>
      res.linkType === linkType &&
      checkIanaLanguage(res, ianaLanguageContexts) &&
      res.defaultContext,
  );
  return response;
};

const matchLinkTypeLanguage = (
  responses: LinkResponse[],
  linkType: string,
  ianaLanguageContexts: IanalanguageContext[],
): LinkResponse => {
  const response = responses.find(
    (res) =>
      res.linkType === linkType && checkIanaLanguage(res, ianaLanguageContexts),
  );
  return response;
};

const matchLinkTypeDefaultLanguage = (
  responses: LinkResponse[],
  linkType: string,
): LinkResponse => {
  const response = responses.find(
    (res) => res.linkType === linkType && res.defaultIanaLanguage,
  );
  return response;
};

const matchLinkType = (
  responses: LinkResponse[],
  linkType: string,
): LinkResponse => {
  const response = responses.find((res) => res.linkType === linkType);
  return response;
};

const matchDefaultLinkType = (responses: LinkResponse[]): LinkResponse => {
  const response = responses.find((res) => res.defaultLinkType);
  return response;
};

const checkIanaLanguageContext = (
  response: LinkResponse,
  ianaLanguageContexts: IanalanguageContext[],
) => {
  return ianaLanguageContexts.some(
    (ianaLanguageContext) =>
      ianaLanguageContext.ianaLanguage &&
      response.ianaLanguage.toLowerCase() ===
        ianaLanguageContext.ianaLanguage.toLowerCase() &&
      ianaLanguageContext.context &&
      response.context.toLowerCase() ===
        ianaLanguageContext.context.toLowerCase(),
  );
};

const checkIanaLanguage = (
  response: LinkResponse,
  ianaLanguageContexts: IanalanguageContext[],
) => {
  return ianaLanguageContexts.some(
    (ianaLanguageContext) =>
      ianaLanguageContext.ianaLanguage &&
      response.ianaLanguage.toLowerCase() ===
        ianaLanguageContext.ianaLanguage.toLowerCase(),
  );
};

const constructResolvedLinkForResponse = (
  response: LinkResponse,
  linkSet: LinkContextObject,
  linkHeaderText: string,
) => {
  return {
    targetUrl: response.targetUrl,
    mimeType: response.mimeType,
    data: { ...constructSetOfLinks(linkSet) },
    fwqs: response.fwqs,
    linkHeaderText: linkHeaderText,
  };
};

const constructResolvedLinkForLinkSet = (
  linkSet: LinkContextObject,
  linkHeaderText: string,
) => {
  return {
    data: { ...constructSetOfLinks(linkSet) },
    mimeType: 'application/json',
    linkHeaderText: linkHeaderText,
  };
};

const constructSetOfLinks = (linkset: LinkContextObject) => {
  return linkset ? { linkset: [linkset] } : { linkset: [] };
};
