import { LinkContextObject } from '../../link-registration/interfaces/link-set.interface';
import { constructLinkSetJson } from '../../link-registration/utils/link-set.utils';
import { LinkResolutionDto } from '../dto/link-resolution.dto';
import {
  ResolvedLink,
  ResolutionContext,
} from '../interfaces/link-resolution.interface';
import { LinkResponse, Uri } from '../interfaces/uri.interface';
import { constructLinkHeader } from './link-header.utils';

/**
 * Rebuild the linkset from the (potentially filtered) responses on a URI.
 * Used when access-role filtering has been applied and the pre-built linkset
 * stored on the document no longer reflects the correct set of responses.
 */
const buildLinksetFromResponses = (
  uri: Uri,
  ctx: ResolutionContext,
): { linkset: LinkContextObject } => {
  const activeResponses = uri.responses.filter((r) => r.active);
  const asDto = {
    namespace: uri.namespace,
    identificationKeyType: uri.identificationKeyType,
    identificationKey: uri.identificationKey,
    qualifierPath: uri.qualifierPath,
    active: uri.active,
    description: uri.description,
    responses: activeResponses,
  };
  const attrs = {
    resolverDomain: ctx.resolverDomain,
    linkTypeVocDomain: ctx.linkTypeVocDomain,
  };
  return {
    linkset: constructLinkSetJson(asDto, ctx.identificationKeyCode, attrs),
  };
};

/**
 * Process the URI and return the appropriate response or linkset.
 *
 * @param uri - the URI document containing responses and pre-built linkset
 * @param identifierParams - request parameters including linkType and descriptive attributes
 * @param context - resolution context used to build linkset and Link header
 * @returns ResolvedLink or undefined if no matching response is found
 */
export const processUri = (
  uri: Uri,
  identifierParams: LinkResolutionDto,
  context: ResolutionContext,
) => {
  if (identifierParams.descriptiveAttributes.linkType === 'all') {
    return processUriForLinkTypeAll(uri, context);
  } else {
    return processUriForSpecificLinkType(uri, identifierParams, context);
  }
};

/**
 * Pick the response that should be served for a specific linkType request.
 *
 * Cascade (most specific wins) when `linkType` is supplied:
 * 1. linkType + hreflang match + requested mimeType
 * 2. linkType + hreflang match + variant flagged `defaultMimeType: true`
 *    (the cascade picks the first hreflang-matching variant whose
 *    `defaultMimeType` flag is set; the variant's `context` field is
 *    not consulted at resolution time, since the request carries no
 *    context signal)
 * 3. linkType + hreflang match
 * 4. linkType + defaultContext
 * 5. linkType
 *
 * When `linkType` is omitted entirely, the cascade is skipped and the
 * single `defaultLinkType` variant is returned instead.
 *
 * "hreflang match" = any of the client's preferred BCP 47 tags appears
 * in the variant's `hreflang[]` array. Matching is case-insensitive on
 * both sides per RFC 4647 §2.1, but no subtag fallback is performed
 * (e.g. en-GB does not match a variant tagged `en`); BCP 47 lookup
 * fallback is tracked separately in #117.
 *
 * `defaultContext` is a pure fallback signal, not a filter on the
 * front tiers. The publisher flags one variant per linkType as
 * `defaultContext: true`. Tier 4 returns that variant when no variant
 * matches the requested language. Tier 5 is a belt-and-braces
 * fallback for the (registration-enforced impossible) case where no
 * defaultContext exists.
 *
 * @param uri - the URI document containing responses and pre-built linkset
 * @param identifierParams - request parameters including linkType and descriptive attributes
 * @param context - resolution context used to build linkset and Link header
 * @returns ResolvedLink or undefined if no matching response is found
 */
const processUriForSpecificLinkType = (
  uri: Uri,
  identifierParams: LinkResolutionDto,
  context: ResolutionContext,
): ResolvedLink | undefined => {
  const responses = uri.responses.filter((res) => res.active).reverse();
  const {
    linkType,
    hreflangPreferences = [],
    mimeTypes = [],
  } = identifierParams.descriptiveAttributes;

  let response: LinkResponse | undefined;

  if (!linkType) {
    response = matchDefaultLinkType(responses);
  } else {
    response =
      matchLinkTypeHreflangMimeType(
        responses,
        linkType,
        hreflangPreferences,
        mimeTypes,
      ) ??
      matchLinkTypeHreflangDefaultMimeType(
        responses,
        linkType,
        hreflangPreferences,
      ) ??
      matchLinkTypeHreflang(responses, linkType, hreflangPreferences) ??
      matchLinkTypeDefaultContext(responses, linkType) ??
      matchLinkType(responses, linkType);
  }

  if (!response) {
    return undefined;
  }

  // Determine linkset: reconstruct if accessRole, else use stored
  const linkset = context.accessRole
    ? buildLinksetFromResponses(uri, context).linkset
    : uri.linkset;

  const { linkHeaderText, linkHeaderTextFull } = constructLinkHeader(
    responses,
    context,
    response.linkType,
  );

  return constructResolvedLinkForResponse(
    response,
    linkset,
    linkHeaderText,
    linkHeaderTextFull,
  );
};

/**
 * Process the URI when request linkType=all.
 *
 * @param uri - the URI document containing responses and pre-built linkset
 * @param context - resolution context used to build linkset and Link header
 * @returns ResolvedLink or undefined if no responses or linkset available
 */
const processUriForLinkTypeAll = (uri: Uri, context: ResolutionContext) => {
  const activeResponses = uri.responses.filter((r) => r.active);
  if (activeResponses.length === 0) {
    return undefined;
  }

  // Determine linkset: reconstruct if accessRole, else use stored
  const linkset = context.accessRole
    ? buildLinksetFromResponses(uri, context).linkset
    : uri.linkset;

  if (!linkset) {
    return undefined;
  }

  // No linkType filter for linkType=all
  const { linkHeaderText, linkHeaderTextFull } = constructLinkHeader(
    activeResponses,
    context,
    undefined,
  );

  return constructResolvedLinkForLinkSet(
    linkset,
    linkHeaderText,
    linkHeaderTextFull,
  );
};

const hreflangMatches = (
  response: LinkResponse,
  hreflangPreferences: string[],
): boolean => {
  if (!response.hreflang || response.hreflang.length === 0) {
    return false;
  }
  const variantTags = response.hreflang.map((t) => t.toLowerCase());
  return hreflangPreferences.some((tag) =>
    variantTags.includes(tag.toLowerCase()),
  );
};

const matchLinkTypeHreflangMimeType = (
  responses: LinkResponse[],
  linkType: string,
  hreflangPreferences: string[],
  mimeTypes: string[],
): LinkResponse | undefined => {
  const requestedMimes = mimeTypes.map((m) => m.toLowerCase());
  return responses.find(
    (res) =>
      res.linkType === linkType &&
      hreflangMatches(res, hreflangPreferences) &&
      requestedMimes.includes(res.mimeType.toLowerCase()),
  );
};

const matchLinkTypeHreflangDefaultMimeType = (
  responses: LinkResponse[],
  linkType: string,
  hreflangPreferences: string[],
): LinkResponse | undefined => {
  return responses.find(
    (res) =>
      res.linkType === linkType &&
      hreflangMatches(res, hreflangPreferences) &&
      res.defaultMimeType,
  );
};

const matchLinkTypeHreflang = (
  responses: LinkResponse[],
  linkType: string,
  hreflangPreferences: string[],
): LinkResponse | undefined => {
  return responses.find(
    (res) =>
      res.linkType === linkType && hreflangMatches(res, hreflangPreferences),
  );
};

const matchLinkTypeDefaultContext = (
  responses: LinkResponse[],
  linkType: string,
): LinkResponse | undefined => {
  return responses.find(
    (res) => res.linkType === linkType && res.defaultContext,
  );
};

const matchLinkType = (
  responses: LinkResponse[],
  linkType: string,
): LinkResponse | undefined => {
  return responses.find((res) => res.linkType === linkType);
};

const matchDefaultLinkType = (
  responses: LinkResponse[],
): LinkResponse | undefined => {
  return responses.find((res) => res.defaultLinkType);
};

const constructResolvedLinkForResponse = (
  response: LinkResponse,
  linkSet: LinkContextObject,
  linkHeaderText: string,
  linkHeaderTextFull: string,
) => {
  return {
    targetUrl: response.targetUrl,
    mimeType: response.mimeType,
    data: { ...constructSetOfLinks(linkSet) },
    fwqs: response.fwqs,
    linkHeaderText,
    linkHeaderTextFull,
  };
};

const constructResolvedLinkForLinkSet = (
  linkSet: LinkContextObject,
  linkHeaderText: string,
  linkHeaderTextFull: string,
) => {
  return {
    data: { ...constructSetOfLinks(linkSet) },
    mimeType: 'application/json',
    linkHeaderText,
    linkHeaderTextFull,
  };
};

const constructSetOfLinks = (linkset: LinkContextObject) => {
  return linkset ? { linkset: [linkset] } : { linkset: [] };
};
