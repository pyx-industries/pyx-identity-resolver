import { I18nService } from 'nestjs-i18n';
import { HttpStatus } from '@nestjs/common';
import { ISO639ValidationPipe } from './iso639-validation.pipe';
import { FieldErrorsException } from '../../../common/exceptions/field-errors.exception';

describe('ISO639ValidationPipe', () => {
  let pipe: ISO639ValidationPipe;
  let mockI18nService: Partial<I18nService>;

  beforeEach(() => {
    // Create a mock I18nService object
    mockI18nService = {
      translate: jest.fn().mockImplementation((key: string) => key),
    };
    // Create a new ISO639ValidationPipe instance
    pipe = new ISO639ValidationPipe(mockI18nService as I18nService);
  });

  it('should pass when all responses contain valid ianaLanguage codes', () => {
    // Define a payload with valid ianaLanguage codes
    const payload = {
      responses: [
        { ianaLanguage: 'en' },
        { ianaLanguage: 'de' },
        { ianaLanguage: 'es' },
      ],
    };

    expect(pipe.transform(payload as any)).toEqual(payload);
  });

  it('should throw FieldErrorsException for an empty ianaLanguage field', () => {
    const payload = {
      responses: [{ ianaLanguage: '' }], // Empty ianaLanguage field
    };

    try {
      pipe.transform(payload as any);
    } catch (error) {
      expect(error).toBeInstanceOf(FieldErrorsException);
      expect(error.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(error.getResponse()).toEqual({
        errors: [
          {
            field: 'ianaLanguage',
            message: 'errors.invalid_iana_language',
          },
        ],
      });
    }
  });

  it('should throw FieldErrorsException if any response contains an invalid ianaLanguage code', () => {
    const payload = {
      responses: [
        { ianaLanguage: 'en' },
        { ianaLanguage: 'fr' },
        { ianaLanguage: 'invalid' }, // Invalid ianaLanguage code
      ],
    };

    try {
      pipe.transform(payload as any);
    } catch (error) {
      expect(error).toBeInstanceOf(FieldErrorsException);
      expect(error.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(error.getResponse()).toEqual({
        errors: [
          {
            field: 'ianaLanguage',
            message: 'errors.invalid_iana_language',
          },
        ],
      });
    }
  });
});
