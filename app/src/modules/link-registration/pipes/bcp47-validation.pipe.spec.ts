import { I18nService } from 'nestjs-i18n';
import { HttpStatus } from '@nestjs/common';
import { FieldErrorsException } from '../../../common/exceptions/field-errors.exception';
import { Bcp47ValidationPipe } from './bcp47-validation.pipe';

describe('Bcp47ValidationPipe', () => {
  let pipe: Bcp47ValidationPipe;
  let mockI18nService: Partial<I18nService>;

  beforeEach(() => {
    // Create a mock I18nService object
    mockI18nService = {
      translate: jest.fn().mockImplementation((key: string) => key),
    };
    // Create a new Bcp47ValidationPipe instance
    pipe = new Bcp47ValidationPipe(mockI18nService as I18nService);
  });

  it('should pass when all responses contain valid context codes', () => {
    // Define a payload with valid context codes
    const payload = {
      responses: [{ context: 'au' }, { context: 'gb' }, { context: 'us' }],
    };

    expect(pipe.transform(payload as any)).toEqual(payload);
  });

  it('should throw FieldErrorsException for an empty context field', () => {
    const payload = {
      responses: [{ context: '' }], // Empty context field
    };

    try {
      pipe.transform(payload as any);
    } catch (error) {
      expect(error).toBeInstanceOf(FieldErrorsException);
      expect(error.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(error.getResponse()).toEqual({
        errors: [
          {
            field: 'context',
            message: 'errors.invalid_context_code',
          },
        ],
      });
    }
  });

  it('should throw FieldErrorsException if any response contains an invalid context code', () => {
    const payload = {
      responses: [
        { context: 'us' },
        { context: 'au' },
        { context: 'invalid' }, // Invalid context code
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
            field: 'context',
            message: 'errors.invalid_context_code',
          },
        ],
      });
    }
  });
});
