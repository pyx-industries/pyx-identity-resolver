import { Response, Request } from 'express';
import { ResolvedLink } from '../interfaces/link-resolution.interface';

export const responseResolvedLink = (
  res: Response,
  req: Request,
  resolvedLink: ResolvedLink,
) => {
  res.setHeader('Link', resolvedLink.linkHeaderText);

  if (
    checkRequestAccepts(req, 'linkset+json') ||
    checkRequestAccepts(req, 'json+linkset')
  ) {
    res.status(200).json(resolvedLink.data);
  } else if (checkRequestAccepts(req, 'linkset')) {
    res.status(200).send(resolvedLink.linkHeaderText);
  } else if (resolvedLink.targetUrl) {
    const link = constructRedirectLink(
      resolvedLink.targetUrl,
      req,
      resolvedLink.fwqs,
    );
    res.redirect(link);
  } else {
    res.status(200).json(resolvedLink.data);
  }
};

/**
 * Construct redirect link
 * @param targetUrl
 * @param req
 * @param fwqsFlag
 * @returns string
 * @private
 */
const constructRedirectLink = (
  targetUrl: string,
  req: Request,
  fwqsFlag: boolean,
) => {
  const queryString = req.query
    ? Object.keys(req.query)
        .map((key) => `${key}=${req.query[key]}`)
        .join('&')
    : '';

  if (fwqsFlag && queryString) {
    if (targetUrl.includes('?')) {
      return `${targetUrl}&${queryString}`;
    }
    return `${targetUrl}?${queryString}`;
  }
  return targetUrl;
};

const checkRequestAccepts = (req: Request, mimeType: string) => {
  return req.accepts().some((accept) => accept.includes(mimeType));
};
