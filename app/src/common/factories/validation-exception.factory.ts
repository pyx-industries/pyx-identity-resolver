import { ValidationError } from 'class-validator';
import { FieldErrorsException } from '../exceptions/field-errors.exception';
import { HttpStatus } from '@nestjs/common';
import { FieldError } from '../dto/errors.dto';
import { I18nContext } from 'nestjs-i18n';

/**
 * Factory function that throws a FieldErrorsException with formatted validation errors.
 * @param errors - The validation errors to be formatted.
 * @throws FieldErrorsException - Throws an exception containing the formatted validation errors.
 */
export function validationExceptionFactory(errors: ValidationError[]): void {
  const constructedErrors = formatValidationErrors(errors);
  const i18n = I18nContext.current().service;
  throw new FieldErrorsException(
    i18n,
    HttpStatus.BAD_REQUEST,
    constructedErrors,
  );
}

/**
 * Formats the validation errors recursively into an array of FieldError objects.
 * @param errors - The validation errors to be formatted.
 * @returns An array of FieldError objects representing the formatted validation errors.
 */
function formatValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): FieldError[] {
  const result = [];
  errors.forEach((error) => {
    const currentPath = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    if (error.constraints) {
      Object.keys(error.constraints).forEach((key) => {
        const fieldError: FieldError = {
          field: currentPath,
          errorProperties: {
            key: key,
            args: { property: error.property },
          },
        };
        result.push(fieldError);
      });
    }
    if (error.children && error.children.length) {
      result.push(...formatValidationErrors(error.children, currentPath));
    }
  });
  return result;
}
