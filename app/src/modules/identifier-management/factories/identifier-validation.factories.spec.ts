import { validateIdentifierQualifiersSetFactory } from './identifier-validation.factories';
import { FieldError } from '../../../common/dto/errors.dto';
import { ErrorCollector } from '../../../common/utils/errors.utils';
import { ApplicationIdentifier } from '../dto/identifier.dto';
import { IdentifierParameters } from '../interfaces/identifier.interface';

describe('Identifier Validation Factories', () => {
  describe('validateIdentifierQualifiersSetFactory', () => {
    let allIdentifiers: ApplicationIdentifier[];
    let identifiers: IdentifierParameters;
    beforeEach(() => {
      allIdentifiers = [
        {
          title: 'Test Identifier',
          label: 'Test Identifier',
          type: 'I',
          shortcode: 'test_identifier',
          ai: '01',
          qualifiers: ['10', '11'],
          regex: '\\d{12,14}|\\d{8}',
        },
        {
          title: 'Test Qualifier',
          label: 'Test Qualifier',
          type: 'Q',
          shortcode: 'test_qualifier_1',
          ai: '10',
          regex: '\\d{12,14}|\\d{8}',
        },
        {
          title: 'Test Qualifier 2',
          label: 'Test Qualifier 2',
          type: 'Q',
          shortcode: 'test_qualifier_2',
          ai: '11',
          regex: '\\d{12,14}|\\d{8}',
        },
      ];
    });

    it('should validate the identifier qualifiers set using ai code', () => {
      identifiers = {
        namespace: 'testNamespace',
        primary: {
          id: '123456789012',
          qualifier: '01',
        },
        secondaries: [
          {
            id: '123456789012',
            qualifier: '10',
          },
        ],
      };
      const errorCollector = new ErrorCollector<FieldError>();
      validateIdentifierQualifiersSetFactory(
        identifiers,
        allIdentifiers,
        errorCollector,
      );
      expect(errorCollector.hasErrors()).toBe(false);
    });

    it('should validate the identifier qualifiers set using shortcode', () => {
      identifiers = {
        namespace: 'testNamespace',
        primary: {
          id: '123456789012',
          qualifier: 'test_identifier',
        },
        secondaries: [
          {
            id: '123456789012',
            qualifier: 'test_qualifier_2',
          },
        ],
      };
      const errorCollector = new ErrorCollector<FieldError>();
      validateIdentifierQualifiersSetFactory(
        identifiers,
        allIdentifiers,
        errorCollector,
      );

      expect(errorCollector.hasErrors()).toBe(false);
    });

    it('should collect an error if the primary identifier is not found', () => {
      identifiers = {
        namespace: 'testNamespace',
        primary: {
          id: '123456789012',
          qualifier: '02',
        },
        secondaries: [
          {
            id: '123456789012',
            qualifier: '10',
          },
        ],
      };
      const errorCollector = new ErrorCollector<FieldError>();
      validateIdentifierQualifiersSetFactory(
        identifiers,
        allIdentifiers,
        errorCollector,
      );

      expect(errorCollector.hasErrors()).toBe(true);
      expect(errorCollector.getErrors()).toEqual([
        {
          field: 'primary',
          errorProperties: {
            key: 'primary_identifier_not_found',
            args: { aiOrShortcode: '02' },
          },
        },
      ]);
    });

    it('should collect an error if the primary identifier value is not valid', () => {
      identifiers = {
        namespace: 'testNamespace',
        primary: {
          id: 'invalid_value',
          qualifier: '01',
        },
        secondaries: [
          {
            id: '123456789012',
            qualifier: '10',
          },
        ],
      };
      const errorCollector = new ErrorCollector<FieldError>();
      validateIdentifierQualifiersSetFactory(
        identifiers,
        allIdentifiers,
        errorCollector,
      );

      expect(errorCollector.hasErrors()).toBe(true);
      expect(errorCollector.getErrors()).toEqual([
        {
          field: 'identificationKey',
          errorProperties: {
            key: 'invalid_value',
            args: { value: 'invalid_value', regex: '\\d{12,14}|\\d{8}' },
          },
        },
      ]);
    });

    it('should collect an error if the secondary identifier is not found', () => {
      identifiers = {
        namespace: 'testNamespace',
        primary: {
          id: '123456789012',
          qualifier: '01',
        },
        secondaries: [
          {
            id: '123456789012',
            qualifier: '12',
          },
        ],
      };
      const errorCollector = new ErrorCollector<FieldError>();
      validateIdentifierQualifiersSetFactory(
        identifiers,
        allIdentifiers,
        errorCollector,
      );

      expect(errorCollector.hasErrors()).toBe(true);
      expect(errorCollector.getErrors()).toEqual([
        {
          field: 'qualifiers',
          errorProperties: {
            key: 'qualifier_not_found',
            args: { aiOrShortcode: '12' },
          },
        },
      ]);
    });
  });
});
