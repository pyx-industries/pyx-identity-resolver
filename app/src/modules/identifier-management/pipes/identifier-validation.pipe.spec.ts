import { IdentifierValidationPipe } from './identifier-validation.pipe';
import { I18nService } from 'nestjs-i18n';
import { IdentifierDto } from '../dto/identifier.dto';
import { FieldErrorsException } from '../../../common/exceptions/field-errors.exception';

describe('IdentifierValidationPipe', () => {
  let pipe: IdentifierValidationPipe;
  let i18nService: I18nService;

  beforeEach(() => {
    i18nService = {
      translate: jest.fn().mockImplementation((key) => key),
    } as unknown as I18nService;
    pipe = new IdentifierValidationPipe(i18nService);
  });

  describe('error type and status', () => {
    it('should throw FieldErrorsException and status code 400', () => {
      const invalidData = {
        applicationIdentifiers: [
          { ai: '01', shortcode: 'A1', type: 'I' },
          { ai: '01', shortcode: 'A2', type: 'I' },
        ],
      } as IdentifierDto;

      try {
        pipe.transform(invalidData);
      } catch (error) {
        expect(error).toBeInstanceOf(FieldErrorsException);
        expect(error.status).toBe(400);
      }
    });
  });

  describe('checkForDuplicateIdentifiers', () => {
    it('should throw error if duplicate AI is found', () => {
      const invalidData = {
        applicationIdentifiers: [
          { ai: '01', shortcode: 'A1', type: 'I' },
          { ai: '01', shortcode: 'A2', type: 'I' },
        ],
      } as IdentifierDto;

      try {
        pipe.transform(invalidData);
      } catch (error) {
        expect(error.response.errors).toEqual([
          {
            field: 'applicationIdentifiers',
            message: 'errors.duplicate_identifier',
          },
        ]);
      }
    });

    it('should throw error if duplicate shortcode is found', () => {
      const invalidData = {
        applicationIdentifiers: [
          { ai: '01', shortcode: 'A1', type: 'I' },
          { ai: '02', shortcode: 'A1', type: 'I' },
        ],
      } as IdentifierDto;

      try {
        pipe.transform(invalidData);
      } catch (error) {
        expect(error.response.errors).toEqual([
          {
            field: 'applicationIdentifiers',
            message: 'errors.duplicate_identifier',
          },
        ]);
      }
    });

    it('should not throw error if no duplicates are found', () => {
      const validData = {
        applicationIdentifiers: [
          { ai: '01', shortcode: 'A1', type: 'I' },
          { ai: '02', shortcode: 'A2', type: 'I' },
        ],
      } as IdentifierDto;

      expect(() => pipe.transform(validData)).not.toThrow();
    });
  });

  describe('validateRegex', () => {
    it('should validate correct regex patterns', () => {
      const validData = {
        applicationIdentifiers: [
          { ai: '01', shortcode: 'A1', type: 'I', regex: '^\\d+$' },
        ],
      } as IdentifierDto;

      expect(() => pipe.transform(validData)).not.toThrow();
    });

    it('should throw error if invalid regex pattern is provided', () => {
      const invalidData = {
        applicationIdentifiers: [
          { ai: '01', shortcode: 'A1', type: 'I', regex: '[' },
        ],
      } as IdentifierDto;

      try {
        pipe.transform(invalidData);
      } catch (error) {
        expect(error.response.errors).toEqual([
          {
            field: 'regex',
            message: 'errors.invalid_regex',
          },
        ]);
      }
    });
  });

  describe('ensureNoQualifiers', () => {
    it('should validate D type identifiers', () => {
      const validData = {
        applicationIdentifiers: [{ ai: 'D1', shortcode: 'D1', type: 'D' }],
      } as IdentifierDto;

      expect(() => pipe.transform(validData)).not.toThrow();
    });

    it('should throw error if D type identifier has qualifiers', () => {
      const invalidData = {
        applicationIdentifiers: [
          { ai: 'D1', shortcode: 'D1', type: 'D', qualifiers: ['Q1'] },
        ],
      } as IdentifierDto;

      try {
        pipe.transform(invalidData);
      } catch (error) {
        expect(error.response.errors).toEqual([
          {
            field: 'qualifiers',
            message: 'errors.data_attribute_must_not_have_qualifiers',
          },
        ]);
      }
    });
  });

  describe('validateQualifierParent', () => {
    it('should validate qualifier parent correctly', () => {
      const validData = {
        applicationIdentifiers: [
          { ai: '01', shortcode: 'A1', type: 'I', qualifiers: ['Q1'] },
          { ai: 'Q1', shortcode: 'Q1', type: 'Q' },
        ],
      } as IdentifierDto;

      expect(() => pipe.transform(validData)).not.toThrow();
    });

    it('should throw error if Q type identifier is not part of any primary identifier', () => {
      const invalidData = {
        applicationIdentifiers: [
          { ai: '01', shortcode: 'A1', type: 'I' },
          { ai: 'Q2', shortcode: 'Q2', type: 'Q' },
        ],
      } as IdentifierDto;

      try {
        pipe.transform(invalidData);
      } catch (error) {
        expect(error.response.errors).toEqual([
          {
            field: 'qualifiers',
            message: 'errors.qualifier_not_part_of_primary',
          },
        ]);
      }
    });
  });

  describe('validateQualifiers', () => {
    it('should validate qualifier correctly', () => {
      const validData = {
        applicationIdentifiers: [
          { ai: '01', shortcode: 'A1', type: 'I', qualifiers: ['Q1'] },
          { ai: 'Q1', shortcode: 'Q1', type: 'Q' },
        ],
      } as IdentifierDto;

      expect(() => pipe.transform(validData)).not.toThrow();
    });

    it('should validate Q type identifiers', () => {
      const validData = {
        applicationIdentifiers: [
          { ai: '01', shortcode: 'A1', type: 'I', qualifiers: ['Q1'] },
          { ai: 'Q1', shortcode: 'Q1', type: 'Q' },
        ],
      } as IdentifierDto;

      expect(() => pipe.transform(validData)).not.toThrow();
    });

    it('should throw error if qualifiers has qualifiers', () => {
      const invalidData = {
        applicationIdentifiers: [
          { ai: '01', shortcode: 'A1', type: 'I', qualifiers: ['Q1'] },
          { ai: 'Q1', shortcode: 'Q1', type: 'Q', qualifiers: ['S1'] },
        ],
      } as IdentifierDto;

      try {
        pipe.transform(invalidData);
      } catch (error) {
        expect(error.response.errors).toEqual([
          {
            field: 'qualifiers',
            message: 'errors.qualifier_must_not_have_qualifiers',
          },
        ]);
      }
    });
  });

  describe('validateIdentifier', () => {
    it('should validate I type identifiers with qualifiers', () => {
      const validData = {
        applicationIdentifiers: [
          { ai: '01', shortcode: 'A1', type: 'I', qualifiers: ['Q1'] },
          { ai: 'Q1', shortcode: 'Q1', type: 'Q' },
        ],
      } as IdentifierDto;

      expect(() => pipe.transform(validData)).not.toThrow();
    });

    it('should throw error if I type identifier has invalid qualifiers', () => {
      const invalidData = {
        applicationIdentifiers: [
          { ai: '01', shortcode: 'A1', type: 'I', qualifiers: ['Q1'] },
        ],
      } as IdentifierDto;

      try {
        pipe.transform(invalidData);
      } catch (error) {
        expect(error.response.errors).toEqual([
          {
            field: 'qualifiers',
            message: 'errors.qualifier_not_found',
          },
        ]);
      }
    });

    it('should throw error if type is not I, Q or D', () => {
      const invalidData = {
        applicationIdentifiers: [
          {
            ai: '01',
            shortcode: 'A1',
            type: 'invalid_type',
          },
        ],
      } as IdentifierDto;

      try {
        pipe.transform(invalidData);
      } catch (error) {
        expect(error.response.errors).toEqual([
          {
            field: 'type',
            message: 'errors.unknown_identifier_type',
          },
        ]);
      }
    });
  });
});
