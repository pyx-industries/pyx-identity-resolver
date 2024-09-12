import { ErrorCollector } from './errors.utils';
import { FieldError } from '../../common/dto/errors.dto';

describe('ErrorCollector', () => {
  it('should add a new error and retrieve it', () => {
    const errorCollector = new ErrorCollector<FieldError>();
    const error: FieldError = {
      field: 'applicationIdentifiers',
      errorProperties: {
        key: 'duplicate_identifier',
        args: { aiOrShortcode: 'AI1' },
      },
    };

    errorCollector.addError(error);
    const errors = errorCollector.getErrors();

    expect(errors).toContainEqual(error);
  });

  it('should return true when there are errors', () => {
    const errorCollector = new ErrorCollector<FieldError>();
    const error: FieldError = {
      field: 'applicationIdentifiers',
      errorProperties: {
        key: 'duplicate_identifier',
        args: { aiOrShortcode: 'AI1' },
      },
    };

    errorCollector.addError(error);

    expect(errorCollector.hasErrors()).toBe(true);
  });

  it('should return false when there are no errors', () => {
    const errorCollector = new ErrorCollector<FieldError>();

    expect(errorCollector.hasErrors()).toBe(false);
  });

  it('should handle multiple errors', () => {
    const errorCollector = new ErrorCollector<FieldError>();
    const error1: FieldError = {
      field: 'applicationIdentifiers',
      errorProperties: {
        key: 'duplicate_identifier',
        args: { aiOrShortcode: 'AI1' },
      },
    };
    const error2: FieldError = {
      field: 'regex',
      errorProperties: {
        key: 'invalid_regex',
        args: { regex: '\\d+(' },
      },
    };

    errorCollector.addError(error1);
    errorCollector.addError(error2);
    const errors = errorCollector.getErrors();

    expect(errors).toContainEqual(error1);
    expect(errors).toContainEqual(error2);
    expect(errors.length).toBe(2);
  });

  it('should handle errors of different types', () => {
    interface CustomError {
      message: string;
      code: number;
    }

    const errorCollector = new ErrorCollector<CustomError>();
    const error: CustomError = {
      message: 'An error occurred',
      code: 123,
    };

    errorCollector.addError(error);
    const errors = errorCollector.getErrors();

    expect(errors).toContainEqual(error);
  });
});
