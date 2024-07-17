import * as _ from 'lodash';
import {
  CreateLinkRegistrationDto,
  Response,
} from '../dto/link-registration.dto';
import {
  LinkContextObject,
  LinkTargetObject,
} from '../interfaces/link-set.interface';

export const constructHTTPLink = (
  uri: CreateLinkRegistrationDto,
  identificationKeyCode: string,
  attrs: { resolverDomain: string; linkTypeVocDomain: string },
): string => {
  let linkText = '';
  uri.responses.forEach((response) => {
    linkText += `<${response.targetUrl}>; rel="${response.linkType}"; type="${response.mimeType}"; hreflang="${response.ianaLanguage}"; title="${response.title}", `;
  });
  return `${linkText}<${buildOriginalRequest(uri, identificationKeyCode, attrs)}>; rel="owl:sameAs"`;
};

export const constructLinkSetJson = (
  uri: CreateLinkRegistrationDto,
  identificationKeyCode: string,
  attrs: { resolverDomain: string; linkTypeVocDomain: string },
): LinkContextObject => {
  const linkContextObject = constructLinkContextObject(
    uri,
    identificationKeyCode,
    attrs,
  );
  return linkContextObject;
};

/**
 *
 * The function constructs the link context object for the link set.
 * @param uri
 * @param identificationKeyCode
 * @param attrs { resolverDomain: string; linkTypeVocDomain: string }
 * @returns LinkContextObject
 */
const constructLinkContextObject = (
  uri: CreateLinkRegistrationDto,
  identificationKeyCode: string,
  attrs: { resolverDomain: string; linkTypeVocDomain: string },
): LinkContextObject => {
  const linkContextObject: LinkContextObject = {
    anchor: buildOriginalRequest(uri, identificationKeyCode, attrs),
  };

  const linkTargetObjects = constructLinkTargetObjects(
    uri.responses,
    attrs.linkTypeVocDomain,
  );
  return { ...linkContextObject, ...linkTargetObjects };
};

/**
 * The function constructs the link target objects for the extension relation types.
 * @param responses
 * @param linkTypeVocDomain
 * @returns Record<string, LinkTargetObject>
 *
 */
const constructLinkTargetObjects = (
  responses: Response[],
  linkTypeVocDomain: string,
): Record<string, LinkTargetObject> => {
  const sortedResponses = postprocessResponses(responses);

  //   Group responses by linkType
  const groupedResponses = _.groupBy(
    sortedResponses,
    (res) => res.linkType,
  ) as Record<string, Response[]>;

  return Object.values(groupedResponses).reduce((acc, responses) => {
    const response = responses[0];
    const key = constructExtensionRelationType(
      linkTypeVocDomain,
      response.linkType,
    );

    // Group responses by mimeType, targetUrl, and context
    const groupResponsesByMimeTypeTargetUrlAndContext = _.groupBy(
      responses,
      (res) => `${res.targetUrl}-${res.mimeType}-${res.context}`,
    );

    acc[key] = [];

    // Construct the link target objects
    Object.values(groupResponsesByMimeTypeTargetUrlAndContext).map(
      (groupedResponses: any) => {
        const firstGroupedResponse = groupedResponses[0];
        const href = firstGroupedResponse.targetUrl;
        const type =
          firstGroupedResponse.mimeType !== 'xx'
            ? firstGroupedResponse.mimeType
            : '';
        const title = firstGroupedResponse.title;

        let titles = groupedResponses
          .filter((res) => res.ianaLanguage && res.ianaLanguage !== 'xx')
          .map((res) => ({ value: res.title, language: res.ianaLanguage }));

        // Remove duplicates on language
        titles = Object.values(
          _.groupBy(titles, (title) => title.language),
        ).map((title) => title[0]);
        const hreflang = titles.map((title) => title.language);

        acc[key].push({ href, title, type, hreflang, 'title*': titles });
      },
    );
    return acc;
  }, {});
};

/**
 * The function sorts the responses by linkType, context, and mimeType. Grouped sort routine sourced from:
 * https://bithacker.dev/javascript-object-multi-property-sort )
 * @param responses
 * @returns responses
 */
const postprocessResponses = (responses: Response[]): Response[] => {
  // Set up the sort priority order with direction = 1 (meaning 'ascending' whereas -1 means descending)
  const sortBy = [
    {
      prop: 'linkType',
      direction: 1,
    },
    {
      prop: 'context',
      direction: 1,
    },
    {
      prop: 'mimeType',
      direction: 1,
    },
  ];

  return responses
    .filter((response) => response.linkType && response.linkType.trim() !== '')
    .map((response) => {
      if (response.mimeType.trim() === '') {
        response.mimeType = 'xx';
      }
      return response;
    })
    .sort((a, b) => {
      let i = 0;
      let result = 0;
      while (i < sortBy.length && result === 0) {
        result =
          sortBy[i].direction *
          (a[sortBy[i].prop].toString() < b[sortBy[i].prop].toString()
            ? -1
            : a[sortBy[i].prop].toString() > b[sortBy[i].prop].toString()
              ? 1
              : 0);
        i += 1;
      }
      return result;
    });
};

const constructExtensionRelationType = (
  linkTypeVocDomain: string,
  linkType: string,
): string => {
  const linkTypeSections = linkType.split(':');
  return `${linkTypeVocDomain}/${linkTypeSections[1]}`;
};

const buildOriginalRequest = (
  uri: CreateLinkRegistrationDto,
  identificationKeyCode: string,
  attrs: { resolverDomain: string; linkTypeVocDomain: string },
) =>
  `${attrs.resolverDomain}/${uri.namespace}/${identificationKeyCode}/${uri.identificationKey}${uri.qualifierPath === '/' ? '' : uri.qualifierPath}`;
