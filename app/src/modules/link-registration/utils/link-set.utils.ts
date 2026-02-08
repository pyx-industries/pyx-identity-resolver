import * as _ from 'lodash';
import {
  LinkContextObject,
  LinkSetInput,
  LinkSetResponseInput,
  LinkTargetObject,
} from '../interfaces/link-set.interface';
import { VersionHistoryEntry } from '../interfaces/versioned-uri.interface';

export const constructHTTPLink = (
  uri: LinkSetInput,
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
  uri: LinkSetInput,
  identificationKeyCode: string,
  attrs: { resolverDomain: string; linkTypeVocDomain: string },
  versionHistory?: VersionHistoryEntry[],
): LinkContextObject => {
  const linkContextObject = constructLinkContextObject(
    uri,
    identificationKeyCode,
    attrs,
    versionHistory,
  );
  return linkContextObject;
};

/**
 *
 * The function constructs the link context object for the link set.
 * @param uri
 * @param identificationKeyCode
 * @param attrs { resolverDomain: string; linkTypeVocDomain: string }
 * @param versionHistory Optional version history for predecessor-version entries
 * @returns LinkContextObject
 */
const constructLinkContextObject = (
  uri: LinkSetInput,
  identificationKeyCode: string,
  attrs: { resolverDomain: string; linkTypeVocDomain: string },
  versionHistory?: VersionHistoryEntry[],
): LinkContextObject => {
  const linkContextObject: LinkContextObject = {
    anchor: buildOriginalRequest(uri, identificationKeyCode, attrs),
  };

  const linkTargetObjects = constructLinkTargetObjects(
    uri.responses,
    attrs.linkTypeVocDomain,
    versionHistory,
  );
  return { ...linkContextObject, ...linkTargetObjects };
};

/**
 * The function constructs the link target objects for the extension relation types.
 * @param responses
 * @param linkTypeVocDomain
 * @param versionHistory Optional version history for predecessor-version entries
 * @returns Record<string, LinkTargetObject[]>
 *
 */
const constructLinkTargetObjects = (
  responses: LinkSetResponseInput[],
  linkTypeVocDomain: string,
  versionHistory?: VersionHistoryEntry[],
): Record<string, LinkTargetObject[]> => {
  const sortedResponses = postprocessResponses(responses);

  //   Group responses by linkType
  const groupedResponses = _.groupBy(
    sortedResponses,
    (res) => res.linkType,
  ) as Record<string, LinkSetResponseInput[]>;

  const result: Record<string, LinkTargetObject[]> = Object.values(
    groupedResponses,
  ).reduce(
    (acc, responses) => {
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

          const linkTarget: LinkTargetObject = {
            href,
            title,
            type,
            hreflang,
            'title*': titles,
          };

          if (firstGroupedResponse.encryptionMethod) {
            linkTarget.encryptionMethod = firstGroupedResponse.encryptionMethod;
          }
          if (firstGroupedResponse.accessRole?.length > 0) {
            linkTarget.accessRole = firstGroupedResponse.accessRole;
          }
          if (firstGroupedResponse.method) {
            linkTarget.method = firstGroupedResponse.method;
          }

          acc[key].push(linkTarget);
        },
      );

      // Add predecessor-version entries for responses in this link type group
      if (versionHistory?.length) {
        for (const response of responses) {
          const linkId = (response as any).linkId;
          if (!linkId) continue;

          for (const entry of versionHistory) {
            for (const change of entry.changes) {
              if (change.linkId !== linkId || !change.previousTargetUrl)
                continue;

              const prevMimeType = change.previousMimeType ?? response.mimeType;
              const prevIanaLanguage =
                change.previousIanaLanguage ?? response.ianaLanguage;

              acc[key].push({
                href: change.previousTargetUrl,
                rel: ['predecessor-version'],
                title: response.title,
                type: prevMimeType !== 'xx' ? prevMimeType : '',
                hreflang: [prevIanaLanguage],
                'title*': [
                  {
                    value: response.title,
                    language: prevIanaLanguage,
                  },
                ],
              });
            }
          }
        }
      }

      return acc;
    },
    {} as Record<string, LinkTargetObject[]>,
  );

  return result;
};

/**
 * The function sorts the responses by linkType, context, and mimeType. Grouped sort routine sourced from:
 * https://bithacker.dev/javascript-object-multi-property-sort )
 * @param responses
 * @returns responses
 */
const postprocessResponses = (
  responses: LinkSetResponseInput[],
): LinkSetResponseInput[] => {
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
  uri: LinkSetInput,
  identificationKeyCode: string,
  attrs: { resolverDomain: string; linkTypeVocDomain: string },
) =>
  `${attrs.resolverDomain}/${uri.namespace}/${identificationKeyCode}/${uri.identificationKey}${uri.qualifierPath === '/' ? '' : uri.qualifierPath}`;
