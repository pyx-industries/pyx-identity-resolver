import { Strategy } from 'passport-custom';
import { PassportStrategy } from '@nestjs/passport';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { GeneralErrorException } from '../../common/exceptions/general-error.exception';
import { AuthStrategy } from '../interfaces/auth.interface';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(
  Strategy,
  AuthStrategy.API_KEY,
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {
    super();
  }

  /**
   * This method is called by Passport to validate the request and return a boolean indicating whether the request is valid.
   * @param request The request object that represents the HTTP request
   * @returns A boolean indicating whether the request is valid
   */
  async validate(request: Request): Promise<boolean> {
    const authHeader = request.headers['authorization'];
    const validApiKey = this.configService.get<string>('API_KEY');
    const apiKey =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.substring(7) // Remove 'Bearer ' from the header
        : null;
    if (!apiKey || apiKey !== validApiKey) {
      throw new GeneralErrorException(this.i18n, HttpStatus.UNAUTHORIZED, {
        key: 'invalid_api_key',
      });
    }

    return true;
  }
}
