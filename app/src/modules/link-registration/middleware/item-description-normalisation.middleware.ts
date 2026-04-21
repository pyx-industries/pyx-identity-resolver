import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

/**
 * Normalises the deprecated `itemDescription` alias on link registration
 * request bodies before the global ValidationPipe runs. If the payload
 * sets `itemDescription` but omits `description`, the value is copied
 * onto `description`. When both are provided, `description` wins. The
 * alias is left on the body; the route's `ValidationPipe({ whitelist: true })`
 * and `LinkRegistrationTransformPipe` together strip it before persistence.
 */
@Injectable()
export class ItemDescriptionNormalisationMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const body = req.body as Record<string, unknown> | undefined;
    if (body && typeof body === 'object') {
      if (body.description == null && body.itemDescription != null) {
        body.description = body.itemDescription;
      }
    }
    next();
  }
}
