import { ConflictException } from '@nestjs/common';
import { CreateLinkRegistrationDto } from '../dto/link-registration.dto';
import {
  processEntryLinkRegistrationData,
  buildResponseKey,
  buildHistoricalKeys,
} from './upsert.utils';

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

  it('should concatenate existing and incoming responses when both have responses', () => {
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

  it('should throw ConflictException when incoming response duplicates an existing one', () => {
    const sharedResponse = {
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
    };

    currentLinkRegistration = {
      namespace: 'testnamespace',
      identificationKeyType: 'testidentificationKeyType',
      identificationKey: 'testidentificationKey',
      itemDescription: '',
      qualifierPath: '',
      active: true,
      responses: [sharedResponse],
    };

    entryLinkRegistration = {
      namespace: 'testnamespace',
      identificationKeyType: 'testidentificationKeyType',
      identificationKey: 'testidentificationKey',
      itemDescription: '',
      qualifierPath: '',
      active: true,
      responses: [sharedResponse],
    };

    expect(() =>
      processEntryLinkRegistrationData(
        currentLinkRegistration,
        entryLinkRegistration,
      ),
    ).toThrow(ConflictException);
  });

  it('should include duplicate details in the ConflictException message', () => {
    const response = {
      targetUrl: 'http://example.com/cert',
      linkType: 'gs1:certificationInfo',
      mimeType: 'application/json',
      ianaLanguage: 'en',
      context: 'au',
      defaultLinkType: false,
      defaultMimeType: false,
      fwqs: false,
      active: true,
      title: 'Cert',
      defaultContext: false,
      defaultIanaLanguage: false,
    };

    currentLinkRegistration = {
      namespace: 'testnamespace',
      identificationKeyType: 'testidentificationKeyType',
      identificationKey: 'testidentificationKey',
      itemDescription: '',
      qualifierPath: '',
      active: true,
      responses: [response],
    };

    entryLinkRegistration = {
      namespace: 'testnamespace',
      identificationKeyType: 'testidentificationKeyType',
      identificationKey: 'testidentificationKey',
      itemDescription: '',
      qualifierPath: '',
      active: true,
      responses: [response],
    };

    expect(() =>
      processEntryLinkRegistrationData(
        currentLinkRegistration,
        entryLinkRegistration,
      ),
    ).toThrow(/gs1:certificationInfo/);
  });

  it('should reject duplicates against previous versions of a response', () => {
    currentLinkRegistration = {
      namespace: 'testnamespace',
      identificationKeyType: 'testidentificationKeyType',
      identificationKey: 'testidentificationKey',
      itemDescription: '',
      qualifierPath: '',
      active: true,
      responses: [
        {
          targetUrl: 'http://example.com/v2',
          linkType: 'type',
          mimeType: 'application/json',
          ianaLanguage: 'en',
          context: 'au',
          defaultLinkType: false,
          defaultMimeType: false,
          fwqs: false,
          active: true,
          title: '',
          defaultContext: false,
          defaultIanaLanguage: false,
          linkId: 'link-1',
        },
      ],
    };

    // Incoming response matches the PREVIOUS targetUrl of link-1
    entryLinkRegistration = {
      namespace: 'testnamespace',
      identificationKeyType: 'testidentificationKeyType',
      identificationKey: 'testidentificationKey',
      itemDescription: '',
      qualifierPath: '',
      active: true,
      responses: [
        {
          targetUrl: 'http://example.com/v1',
          linkType: 'type',
          mimeType: 'application/json',
          ianaLanguage: 'en',
          context: 'au',
          defaultLinkType: false,
          defaultMimeType: false,
          fwqs: false,
          active: true,
          title: '',
          defaultContext: false,
          defaultIanaLanguage: false,
        },
      ],
    };

    const versionHistory = [
      {
        version: 2,
        updatedAt: '2024-06-01T00:00:00.000Z',
        changes: [
          {
            linkId: 'link-1',
            action: 'updated' as const,
            previousTargetUrl: 'http://example.com/v1',
          },
        ],
      },
    ];

    expect(() =>
      processEntryLinkRegistrationData(
        currentLinkRegistration,
        entryLinkRegistration,
        versionHistory,
      ),
    ).toThrow(ConflictException);
  });

  it('should allow responses that do not match any current or historical version', () => {
    currentLinkRegistration = {
      namespace: 'testnamespace',
      identificationKeyType: 'testidentificationKeyType',
      identificationKey: 'testidentificationKey',
      itemDescription: '',
      qualifierPath: '',
      active: true,
      responses: [
        {
          targetUrl: 'http://example.com/v2',
          linkType: 'type',
          mimeType: 'application/json',
          ianaLanguage: 'en',
          context: 'au',
          defaultLinkType: false,
          defaultMimeType: false,
          fwqs: false,
          active: true,
          title: '',
          defaultContext: false,
          defaultIanaLanguage: false,
          linkId: 'link-1',
        },
      ],
    };

    // Completely different response — should be allowed
    entryLinkRegistration = {
      namespace: 'testnamespace',
      identificationKeyType: 'testidentificationKeyType',
      identificationKey: 'testidentificationKey',
      itemDescription: '',
      qualifierPath: '',
      active: true,
      responses: [
        {
          targetUrl: 'http://example.com/new',
          linkType: 'different-type',
          mimeType: 'text/html',
          ianaLanguage: 'fr',
          context: 'ca',
          defaultLinkType: false,
          defaultMimeType: false,
          fwqs: false,
          active: true,
          title: '',
          defaultContext: false,
          defaultIanaLanguage: false,
        },
      ],
    };

    const versionHistory = [
      {
        version: 2,
        updatedAt: '2024-06-01T00:00:00.000Z',
        changes: [
          {
            linkId: 'link-1',
            action: 'updated' as const,
            previousTargetUrl: 'http://example.com/v1',
          },
        ],
      },
    ];

    const result = processEntryLinkRegistrationData(
      currentLinkRegistration,
      entryLinkRegistration,
      versionHistory,
    );

    expect(result.responses).toHaveLength(2);
  });

  it('should reject duplicates against inactive (soft-deleted) responses', () => {
    const inactiveResponse = {
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
    };

    currentLinkRegistration = {
      namespace: 'testnamespace',
      identificationKeyType: 'testidentificationKeyType',
      identificationKey: 'testidentificationKey',
      itemDescription: '',
      qualifierPath: '',
      active: true,
      responses: [inactiveResponse],
    };

    entryLinkRegistration = {
      namespace: 'testnamespace',
      identificationKeyType: 'testidentificationKeyType',
      identificationKey: 'testidentificationKey',
      itemDescription: '',
      qualifierPath: '',
      active: true,
      responses: [{ ...inactiveResponse, active: true }],
    };

    expect(() =>
      processEntryLinkRegistrationData(
        currentLinkRegistration,
        entryLinkRegistration,
      ),
    ).toThrow(ConflictException);
  });

  it('should preserve linkId and createdAt on existing responses during concatenation', () => {
    // Stored documents have service-enriched fields (linkId, createdAt)
    // beyond the base Response DTO shape.
    const existingResponse = {
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
    };

    currentLinkRegistration = {
      namespace: 'testnamespace',
      identificationKeyType: 'testidentificationKeyType',
      identificationKey: 'testidentificationKey',
      itemDescription: '',
      qualifierPath: '',
      active: true,
      responses: [existingResponse],
    } as CreateLinkRegistrationDto;

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
          linkType: 'type2',
          mimeType: 'type2',
          ianaLanguage: 'en',
          context: 'context2',
          defaultLinkType: false,
          defaultMimeType: false,
          fwqs: false,
          active: true,
          title: 'New',
          defaultContext: false,
          defaultIanaLanguage: false,
        },
      ],
    };

    const result = processEntryLinkRegistrationData(
      currentLinkRegistration,
      entryLinkRegistration,
    );

    // Existing response retains its linkId and createdAt
    expect(result.responses[0].linkId).toBe('existing-link-id-123');
    expect((result.responses[0] as typeof existingResponse).createdAt).toBe(
      '2024-01-01T00:00:00.000Z',
    );
    // New response has no linkId (assigned later by the service)
    expect(result.responses[1].linkId).toBeUndefined();
  });

  it('should use incoming top-level properties when merging', () => {
    currentLinkRegistration = {
      namespace: 'testnamespace',
      identificationKeyType: 'testidentificationKeyType',
      identificationKey: 'testidentificationKey',
      itemDescription: 'old description',
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
      itemDescription: 'new description',
      qualifierPath: '',
      active: false,
      responses: [],
    };

    const result = processEntryLinkRegistrationData(
      currentLinkRegistration,
      entryLinkRegistration,
    );

    expect(result.itemDescription).toBe('new description');
    expect(result.active).toBe(false);
    // Existing responses are still present from concatenation
    expect(result.responses).toHaveLength(1);
  });
});

describe('buildResponseKey', () => {
  it('should build a composite key from targetUrl, linkType, mimeType, ianaLanguage, and context', () => {
    const response = {
      targetUrl: 'http://example.com',
      linkType: 'gs1:certificationInfo',
      mimeType: 'application/json',
      ianaLanguage: 'en',
      context: 'au',
      defaultLinkType: false,
      defaultMimeType: false,
      fwqs: false,
      active: true,
      title: 'Cert',
      defaultContext: false,
      defaultIanaLanguage: false,
    };

    expect(buildResponseKey(response)).toBe(
      'http://example.com|gs1:certificationInfo|application/json|en|au',
    );
  });

  it('should produce different keys when any field differs', () => {
    const base = {
      targetUrl: 'http://example.com',
      linkType: 'type',
      mimeType: 'type',
      ianaLanguage: 'en',
      context: 'au',
      defaultLinkType: false,
      defaultMimeType: false,
      fwqs: false,
      active: true,
      title: '',
      defaultContext: false,
      defaultIanaLanguage: false,
    };

    const withDifferentUrl = { ...base, targetUrl: 'http://other.com' };
    const withDifferentLang = { ...base, ianaLanguage: 'fr' };

    expect(buildResponseKey(base)).not.toBe(buildResponseKey(withDifferentUrl));
    expect(buildResponseKey(base)).not.toBe(
      buildResponseKey(withDifferentLang),
    );
  });
});

describe('buildHistoricalKeys', () => {
  const baseResponse = {
    targetUrl: 'http://example.com/v2',
    linkType: 'gs1:certificationInfo',
    mimeType: 'application/json',
    ianaLanguage: 'fr',
    context: 'us',
    defaultLinkType: false,
    defaultMimeType: false,
    fwqs: false,
    active: true,
    title: '',
    defaultContext: false,
    defaultIanaLanguage: false,
    linkId: 'link-1',
  };

  it('should reconstruct historical key when only previousTargetUrl is present', () => {
    const responses = [baseResponse];
    const versionHistory = [
      {
        version: 2,
        updatedAt: '2024-06-01T00:00:00.000Z',
        changes: [
          {
            linkId: 'link-1',
            action: 'updated' as const,
            previousTargetUrl: 'http://example.com/v1',
          },
        ],
      },
    ];

    const keys = buildHistoricalKeys(responses, versionHistory);

    expect(keys.size).toBe(1);
    expect(
      keys.has(
        'http://example.com/v1|gs1:certificationInfo|application/json|fr|us',
      ),
    ).toBe(true);
  });

  it('should reconstruct historical key when previousMimeType is present', () => {
    const responses = [baseResponse];
    const versionHistory = [
      {
        version: 2,
        updatedAt: '2024-06-01T00:00:00.000Z',
        changes: [
          {
            linkId: 'link-1',
            action: 'updated' as const,
            previousMimeType: 'text/html',
          },
        ],
      },
    ];

    const keys = buildHistoricalKeys(responses, versionHistory);

    expect(keys.size).toBe(1);
    expect(
      keys.has('http://example.com/v2|gs1:certificationInfo|text/html|fr|us'),
    ).toBe(true);
  });

  it('should reconstruct historical key when previousIanaLanguage is present', () => {
    const responses = [baseResponse];
    const versionHistory = [
      {
        version: 2,
        updatedAt: '2024-06-01T00:00:00.000Z',
        changes: [
          {
            linkId: 'link-1',
            action: 'updated' as const,
            previousIanaLanguage: 'en',
          },
        ],
      },
    ];

    const keys = buildHistoricalKeys(responses, versionHistory);

    expect(keys.size).toBe(1);
    expect(
      keys.has(
        'http://example.com/v2|gs1:certificationInfo|application/json|en|us',
      ),
    ).toBe(true);
  });

  it('should reconstruct historical key when previousContext is present', () => {
    const responses = [baseResponse];
    const versionHistory = [
      {
        version: 2,
        updatedAt: '2024-06-01T00:00:00.000Z',
        changes: [
          {
            linkId: 'link-1',
            action: 'updated' as const,
            previousContext: 'au',
          },
        ],
      },
    ];

    const keys = buildHistoricalKeys(responses, versionHistory);

    expect(keys.size).toBe(1);
    expect(
      keys.has(
        'http://example.com/v2|gs1:certificationInfo|application/json|fr|au',
      ),
    ).toBe(true);
  });

  it('should reconstruct historical key using all previous fields', () => {
    const responses = [baseResponse];
    const versionHistory = [
      {
        version: 2,
        updatedAt: '2024-06-01T00:00:00.000Z',
        changes: [
          {
            linkId: 'link-1',
            action: 'updated' as const,
            previousTargetUrl: 'http://example.com/v1',
            previousLinkType: 'gs1:productInfo',
            previousMimeType: 'text/html',
            previousIanaLanguage: 'en',
            previousContext: 'au',
          },
        ],
      },
    ];

    const keys = buildHistoricalKeys(responses, versionHistory);

    expect(keys.size).toBe(1);
    expect(
      keys.has('http://example.com/v1|gs1:productInfo|text/html|en|au'),
    ).toBe(true);
  });

  it('should skip history entries with no previous fields', () => {
    const responses = [baseResponse];
    const versionHistory = [
      {
        version: 1,
        updatedAt: '2024-05-01T00:00:00.000Z',
        changes: [
          {
            linkId: 'link-1',
            action: 'created' as const,
          },
        ],
      },
    ];

    const keys = buildHistoricalKeys(responses, versionHistory);

    expect(keys.size).toBe(0);
  });

  it('should skip history entries for removed responses', () => {
    const responses = [baseResponse];
    const versionHistory = [
      {
        version: 2,
        updatedAt: '2024-06-01T00:00:00.000Z',
        changes: [
          {
            linkId: 'link-deleted',
            action: 'updated' as const,
            previousTargetUrl: 'http://example.com/deleted',
          },
        ],
      },
    ];

    const keys = buildHistoricalKeys(responses, versionHistory);

    expect(keys.size).toBe(0);
  });
});
