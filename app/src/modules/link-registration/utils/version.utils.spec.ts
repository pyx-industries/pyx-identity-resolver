import {
  generateLinkId,
  createVersionHistoryEntry,
  normaliseDocument,
} from './version.utils';
import { LinkChange } from '../interfaces/versioned-uri.interface';

describe('Version Utils', () => {
  describe('generateLinkId', () => {
    it('should return a valid UUID v4 string', () => {
      const linkId = generateLinkId();

      expect(linkId).toHaveLength(36);
      expect(linkId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should return unique values on repeated calls', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateLinkId());
      }

      expect(ids.size).toBe(100);
    });
  });

  describe('createVersionHistoryEntry', () => {
    it('should return an entry with the correct version number', () => {
      const changes: LinkChange[] = [{ linkId: 'abc123', action: 'created' }];

      const entry = createVersionHistoryEntry(3, changes);

      expect(entry.version).toBe(3);
    });

    it('should return an entry with the correct changes array', () => {
      const changes: LinkChange[] = [
        { linkId: 'abc123', action: 'created' },
        {
          linkId: 'def456',
          action: 'updated',
          previousTargetUrl: 'https://old.example.com',
        },
      ];

      const entry = createVersionHistoryEntry(2, changes);

      expect(entry.changes).toEqual(changes);
    });

    it('should set updatedAt to a valid ISO timestamp', () => {
      const before = new Date().toISOString();
      const entry = createVersionHistoryEntry(1, []);
      const after = new Date().toISOString();

      expect(entry.updatedAt).toBeDefined();
      expect(new Date(entry.updatedAt).toISOString()).toBe(entry.updatedAt);
      expect(entry.updatedAt >= before).toBe(true);
      expect(entry.updatedAt <= after).toBe(true);
    });

    it('should use the provided timestamp when given', () => {
      const timestamp = '2024-06-15T12:00:00.000Z';
      const entry = createVersionHistoryEntry(2, [], timestamp);
      expect(entry.updatedAt).toBe(timestamp);
    });
  });

  describe('normaliseDocument', () => {
    it('should set version to 1 for a document without version', () => {
      const doc = { id: 'test' };

      const result = normaliseDocument(doc);

      expect(result.version).toBe(1);
    });

    it('should preserve the existing version if present', () => {
      const doc = { id: 'test', version: 5 };

      const result = normaliseDocument(doc);

      expect(result.version).toBe(5);
    });

    it('should preserve version 0 without overwriting', () => {
      const doc = { id: 'test', version: 0 };
      const result = normaliseDocument(doc);
      expect(result.version).toBe(0);
    });

    it('should initialise undefined responses to an empty array', () => {
      const doc = { id: 'test' };
      const result = normaliseDocument(doc);
      expect((result as any).responses).toEqual([]);
    });

    it('should set updatedAt from createdAt if updatedAt is missing', () => {
      const createdAt = '2024-01-15T10:00:00.000Z';
      const doc = { id: 'test', createdAt };

      const result = normaliseDocument(doc);

      expect(result.updatedAt).toBe(createdAt);
    });

    it('should set updatedAt to current time if neither createdAt nor updatedAt exist', () => {
      const before = new Date().toISOString();
      const doc = { id: 'test' };

      const result = normaliseDocument(doc);

      const after = new Date().toISOString();
      expect(result.updatedAt >= before).toBe(true);
      expect(result.updatedAt <= after).toBe(true);
    });

    it('should initialise empty versionHistory if missing', () => {
      const doc = { id: 'test' };

      const result = normaliseDocument(doc);

      expect(result.versionHistory).toEqual([]);
    });

    it('should preserve existing versionHistory', () => {
      const existingHistory = [
        {
          version: 1,
          updatedAt: '2024-01-01T00:00:00.000Z',
          changes: [{ linkId: 'abc', action: 'created' as const }],
        },
      ];
      const doc = { id: 'test', versionHistory: existingHistory };

      const result = normaliseDocument(doc);

      expect(result.versionHistory).toEqual(existingHistory);
    });

    it('should assign linkId to responses without one', () => {
      const doc = {
        id: 'test',
        responses: [
          {
            targetUrl: 'https://example.com',
            title: 'Example',
            linkType: 'idr:test',
            ianaLanguage: 'en',
            context: 'us',
            mimeType: 'application/json',
            active: true,
            fwqs: false,
            defaultLinkType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            defaultMimeType: true,
          },
        ],
      };

      const result = normaliseDocument(doc);

      expect((result.responses[0] as any).linkId).toBeDefined();
      expect((result.responses[0] as any).linkId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should preserve existing linkId on responses', () => {
      const doc = {
        id: 'test',
        responses: [
          {
            targetUrl: 'https://example.com',
            title: 'Example',
            linkType: 'idr:test',
            ianaLanguage: 'en',
            context: 'us',
            mimeType: 'application/json',
            active: true,
            fwqs: false,
            defaultLinkType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            defaultMimeType: true,
            linkId: 'existing1',
          },
        ],
      };

      const result = normaliseDocument(doc);

      expect((result.responses[0] as any).linkId).toBe('existing1');
    });

    it('should assign createdAt and updatedAt to responses missing them', () => {
      const createdAt = '2024-06-01T12:00:00.000Z';
      const updatedAt = '2024-06-02T12:00:00.000Z';
      const doc = {
        id: 'test',
        createdAt,
        updatedAt,
        responses: [
          {
            targetUrl: 'https://example.com',
            title: 'Example',
            linkType: 'idr:test',
            ianaLanguage: 'en',
            context: 'us',
            mimeType: 'application/json',
            active: true,
            fwqs: false,
            defaultLinkType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            defaultMimeType: true,
          },
        ],
      };

      const result = normaliseDocument(doc);

      expect((result.responses[0] as any).createdAt).toBe(createdAt);
      expect((result.responses[0] as any).updatedAt).toBe(updatedAt);
    });

    it('should not modify a fully populated document', () => {
      const doc = {
        id: 'test',
        version: 3,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-02-01T00:00:00.000Z',
        versionHistory: [
          {
            version: 2,
            updatedAt: '2024-01-15T00:00:00.000Z',
            changes: [{ linkId: 'abc', action: 'updated' as const }],
          },
        ],
        responses: [
          {
            targetUrl: 'https://example.com',
            title: 'Example',
            linkType: 'idr:test',
            ianaLanguage: 'en',
            context: 'us',
            mimeType: 'application/json',
            active: true,
            fwqs: false,
            defaultLinkType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            defaultMimeType: true,
            linkId: 'existing1',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-02-01T00:00:00.000Z',
          },
        ],
      };

      const result = normaliseDocument(doc);

      expect(result.version).toBe(3);
      expect(result.updatedAt).toBe('2024-02-01T00:00:00.000Z');
      expect(result.versionHistory).toEqual(doc.versionHistory);
      expect((result.responses[0] as any).linkId).toBe('existing1');
      expect(result.responses[0].createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(result.responses[0].updatedAt).toBe('2024-02-01T00:00:00.000Z');
    });
  });
});
