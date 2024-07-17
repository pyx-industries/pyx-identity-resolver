import { IdentifierDto } from '../dto/identifier.dto';
import { processEntryIdentifierData } from './upsert.utils';

describe('processEntryIdentifierData', () => {
  let currentIdentifier: IdentifierDto | undefined;
  let entryIdentifier: IdentifierDto;

  beforeEach(() => {
    currentIdentifier = undefined;
    entryIdentifier = {
      namespace: 'example',
      applicationIdentifiers: [
        {
          ai: '123456',
          type: 'I',
          shortcode: 'EX',
          title: 'title',
          label: 'label',
          regex: '',
        },
      ],
    };
  });

  it('should return the entryIdentifier when currentIdentifier is undefined', () => {
    const result = processEntryIdentifierData(
      currentIdentifier,
      entryIdentifier,
    );
    expect(result).toEqual(entryIdentifier);
  });

  it('should merge the properties of currentIdentifier and entryIdentifier', () => {
    currentIdentifier = {
      namespace: 'example',
      applicationIdentifiers: [
        {
          ai: '123456',
          type: 'I',
          shortcode: 'EX',
          title: 'existing title',
          label: 'existing label',
          regex: 'existing regex',
        },
      ],
    };

    const result = processEntryIdentifierData(
      currentIdentifier,
      entryIdentifier,
    );
    expect(result).toEqual(entryIdentifier);
  });

  it('should append the applicationIdentifiers of entryIdentifier to currentIdentifier', () => {
    currentIdentifier = {
      namespace: 'example',
      applicationIdentifiers: [
        {
          ai: '654321',
          type: 'I',
          shortcode: 'EX',
          title: 'existing title',
          label: 'existing label',
          regex: 'existing regex',
        },
      ],
    };

    const result = processEntryIdentifierData(
      currentIdentifier,
      entryIdentifier,
    );
    expect(result).toEqual({
      namespace: 'example',
      applicationIdentifiers: [
        {
          ai: '654321',
          type: 'I',
          shortcode: 'EX',
          title: 'existing title',
          label: 'existing label',
          regex: 'existing regex',
        },
        {
          ai: '123456',
          type: 'I',
          shortcode: 'EX',
          title: 'title',
          label: 'label',
          regex: '',
        },
      ],
    });
  });
});
