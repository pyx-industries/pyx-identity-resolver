import { CreateLinkRegistrationDto } from '../dto/link-registration.dto';
import { processEntryLinkRegistrationData } from './upsert.utils';

describe('processEntryLinkRegistrationData', () => {
  let currentLinkRegistration: CreateLinkRegistrationDto | undefined;
  let entryLinkRegistration: CreateLinkRegistrationDto;

  beforeEach(() => {
    currentLinkRegistration = undefined;
    entryLinkRegistration = {
      namespace: 'testnamespace',
      identificationKeyType: 'testidentificationKeyType',
      identificationKey: 'testidentificationKey',
      itemDescription: '',
      qualifierPath: '',
      active: true,
      responses: [
        {
          targetUrl: 'http://example.com',
          linkType: 'type',
          mimeType: 'type',
          ianaLanguage: 'en',
          context: 'context',
          defaultLinkType: false,
          defaultMimeType: false,
          fwqs: false,
          active: false,
          title: '',
          defaultContext: false,
          defaultIanaLanguage: false,
        },
      ],
    };
  });

  it('should return the entryLinkRegistration when currentLinkRegistration is undefined', () => {
    const result = processEntryLinkRegistrationData(
      currentLinkRegistration,
      entryLinkRegistration,
    );
    expect(result).toEqual(entryLinkRegistration);
  });

  it('should merge the properties of currentLinkRegistration and entryLinkRegistration', () => {
    currentLinkRegistration = {
      namespace: 'testnamespace',
      identificationKeyType: 'testidentificationKeyType',
      identificationKey: 'testidentificationKey',
      itemDescription: '',
      qualifierPath: '',
      active: true,
      responses: [
        {
          targetUrl: 'http://example.com',
          linkType: 'type',
          mimeType: 'type',
          ianaLanguage: 'en',
          context: 'context',
          defaultLinkType: false,
          defaultMimeType: false,
          fwqs: false,
          active: false,
          title: '',
          defaultContext: false,
          defaultIanaLanguage: false,
        },
      ],
    };

    const result = processEntryLinkRegistrationData(
      currentLinkRegistration,
      entryLinkRegistration,
    );
    expect(result).toEqual(entryLinkRegistration);
  });

  it('should append the responses of entryLinkRegistration to currentLinkRegistration', () => {
    currentLinkRegistration = {
      namespace: 'testnamespace',
      identificationKeyType: 'testidentificationKeyType',
      identificationKey: 'testidentificationKey',
      itemDescription: '',
      qualifierPath: '',
      active: true,
      responses: [
        {
          targetUrl: 'http://example.com',
          linkType: 'type',
          mimeType: 'type',
          ianaLanguage: 'en',
          context: 'context',
          defaultLinkType: false,
          defaultMimeType: false,
          fwqs: false,
          active: false,
          title: '',
          defaultContext: false,
          defaultIanaLanguage: false,
        },
      ],
    };

    entryLinkRegistration = {
      namespace: 'testnamespace',
      identificationKeyType: 'testidentificationKeyType',
      identificationKey: 'testidentificationKey',
      itemDescription: '',
      qualifierPath: '',
      active: true,
      responses: [
        {
          targetUrl: 'http://example2.com',
          linkType: 'type',
          mimeType: 'type',
          ianaLanguage: 'en',
          context: 'context',
          defaultLinkType: false,
          defaultMimeType: false,
          fwqs: false,
          active: false,
          title: '',
          defaultContext: false,
          defaultIanaLanguage: false,
        },
      ],
    };

    const result = processEntryLinkRegistrationData(
      currentLinkRegistration,
      entryLinkRegistration,
    );
    expect(result).toEqual({
      ...entryLinkRegistration,
      responses: [
        ...currentLinkRegistration.responses,
        ...entryLinkRegistration.responses,
      ],
    });
  });

  it('should preserve linkId and createdAt from existing responses during merge', () => {
    currentLinkRegistration = {
      namespace: 'testnamespace',
      identificationKeyType: 'testidentificationKeyType',
      identificationKey: 'testidentificationKey',
      itemDescription: '',
      qualifierPath: '',
      active: true,
      responses: [
        {
          targetUrl: 'http://example.com',
          linkType: 'type',
          mimeType: 'type',
          ianaLanguage: 'en',
          context: 'context',
          defaultLinkType: false,
          defaultMimeType: false,
          fwqs: false,
          active: false,
          title: '',
          defaultContext: false,
          defaultIanaLanguage: false,
          linkId: 'existing-link-id-123',
          createdAt: '2024-01-01T00:00:00.000Z',
        } as any,
      ],
    };

    // Incoming response matches by key but has no linkId
    entryLinkRegistration = {
      namespace: 'testnamespace',
      identificationKeyType: 'testidentificationKeyType',
      identificationKey: 'testidentificationKey',
      itemDescription: '',
      qualifierPath: '',
      active: true,
      responses: [
        {
          targetUrl: 'http://example.com',
          linkType: 'type',
          mimeType: 'type',
          ianaLanguage: 'en',
          context: 'context',
          defaultLinkType: false,
          defaultMimeType: false,
          fwqs: false,
          active: true,
          title: 'Updated',
          defaultContext: false,
          defaultIanaLanguage: false,
        },
      ],
    };

    const result = processEntryLinkRegistrationData(
      currentLinkRegistration,
      entryLinkRegistration,
    );

    expect((result.responses[0] as any).linkId).toBe('existing-link-id-123');
    expect((result.responses[0] as any).createdAt).toBe(
      '2024-01-01T00:00:00.000Z',
    );
  });
});
