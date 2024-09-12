import { validationExceptionFactory } from '../factories/validation-exception.factory';
import { FieldErrorsException } from '../exceptions/field-errors.exception';
import { ValidationError } from 'class-validator';

jest.mock('nestjs-i18n', () => ({
  I18nContext: {
    current: jest.fn().mockReturnValue({
      service: {
        translate: jest.fn().mockReturnValue('translated message'),
      },
    }),
  },
}));

describe('validationExceptionFactory', () => {
  it('should throw a FieldErrorsException with formatted validation errors', () => {
    const errors: ValidationError[] = [
      {
        property: 'username',
        constraints: {
          isNotEmpty: 'Username should not be empty',
        },
      },
      {
        property: 'object',
        children: [
          {
            property: 'nested',
            constraints: {
              isNotEmpty: 'Nested property should not be empty',
            },
          },
        ],
      },
    ];

    expect(() => validationExceptionFactory(errors)).toThrow(
      FieldErrorsException,
    );
  });
});
