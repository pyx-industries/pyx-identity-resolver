import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { APP_ROUTE_PREFIX } from '../../src/common/utils/config.utils';
import { IdentifierDto } from '../../src/modules/identifier-management/dto/identifier.dto';
import {
  EncryptionMethod,
  UntpAccessRole,
} from '../../src/modules/link-registration/constants/untp-enums';

const baseUrl = process.env.API_BASE_URL + APP_ROUTE_PREFIX;
const environment = process.env.NODE_ENV;
const apiKey = process.env.API_KEY;

// Unique namespace to avoid data pollution
const gs1 = `e2e-${environment}-link-mgmt-gs1`;

describe('LinkManagementController (e2e)', () => {
  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  const createIdentifierDto = (): IdentifierDto => ({
    namespace: gs1,
    namespaceProfile: '',
    namespaceURI: '',
    applicationIdentifiers: [
      {
        ai: '01',
        shortcode: 'gtin',
        type: 'I',
        title: 'Global Trade Item Number (GTIN)',
        label: 'GTIN',
        regex: '(\\d{12,14}|\\d{8})',
        qualifiers: ['22', '10', '21'],
      },
      {
        ai: '10',
        shortcode: 'lot',
        type: 'Q',
        title: 'Batch or lot number',
        label: 'BATCH/LOT',
        regex:
          '([\\x21-\\x22\\x25-\\x2F\\x30-\\x39\\x41-\\x5A\\x5F\\x61-\\x7A]{0,20})',
      },
      {
        ai: '21',
        shortcode: 'ser',
        type: 'Q',
        title: 'Serial number',
        label: 'SERIAL',
        regex:
          '([\\x21-\\x22\\x25-\\x2F\\x30-\\x39\\x41-\\x5A\\x5F\\x61-\\x7A]{0,20})',
      },
      {
        ai: '22',
        shortcode: 'cpv',
        type: 'Q',
        title: 'Consumer product variant',
        label: 'CPV',
        regex:
          '([\\x21-\\x22\\x25-\\x2F\\x30-\\x39\\x41-\\x5A\\x5F\\x61-\\x7A]{0,20})',
      },
    ],
  });

  const listLinksQuery = {
    namespace: gs1,
    identificationKeyType: 'gtin',
    identificationKey: '09359502000010',
    qualifierPath: '/',
  };

  beforeAll(async () => {
    // Register namespace
    await request(baseUrl)
      .post('/identifiers')
      .set('Authorization', `Bearer ${apiKey}`)
      .send(createIdentifierDto())
      .expect(HttpStatus.OK);

    // Register a link resolver with two responses
    await request(baseUrl)
      .post('/resolver')
      .set(headers)
      .send({
        namespace: gs1,
        identificationKeyType: 'gtin',
        identificationKey: '09359502000010',
        itemDescription: 'Test Product',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            defaultLinkType: true,
            defaultMimeType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            fwqs: false,
            active: true,
            linkType: `${gs1}:certificationInfo`,
            ianaLanguage: 'en',
            context: 'au',
            title: 'Certification Information',
            targetUrl: 'https://example.com/cert',
            mimeType: 'application/json',
          },
          {
            defaultLinkType: false,
            defaultMimeType: false,
            defaultIanaLanguage: false,
            defaultContext: false,
            fwqs: false,
            active: true,
            linkType: `${gs1}:pip`,
            ianaLanguage: 'en',
            context: 'au',
            title: 'Product Information',
            targetUrl: 'https://example.com/product',
            mimeType: 'text/html',
          },
        ],
      })
      .expect(HttpStatus.CREATED);
  });

  afterAll(async () => {
    // Clean up: remove the namespace and all associated data
    await request(baseUrl)
      .delete('/identifiers')
      .set('Authorization', `Bearer ${apiKey}`)
      .query({ namespace: gs1 })
      .expect(HttpStatus.OK);
  });

  describe('GET /resolver/links (List Links)', () => {
    it('should list all links for an identifier', async () => {
      const res = await request(baseUrl)
        .get('/resolver/links')
        .set(headers)
        .query(listLinksQuery)
        .expect(HttpStatus.OK);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
      res.body.forEach((link: any) => {
        expect(link.linkId).toBeDefined();
        expect(typeof link.linkId).toBe('string');
      });
    });

    it('should return links containing expected fields', async () => {
      const res = await request(baseUrl)
        .get('/resolver/links')
        .set(headers)
        .query(listLinksQuery)
        .expect(HttpStatus.OK);

      const link = res.body[0];
      expect(link).toHaveProperty('linkId');
      expect(link).toHaveProperty('targetUrl');
      expect(link).toHaveProperty('linkType');
      expect(link).toHaveProperty('title');
      expect(link).toHaveProperty('mimeType');
      expect(link).toHaveProperty('ianaLanguage');
      expect(link).toHaveProperty('context');
      expect(link).toHaveProperty('active');
    });

    it('should filter responses by linkType', async () => {
      const res = await request(baseUrl)
        .get('/resolver/links')
        .set(headers)
        .query({ ...listLinksQuery, linkType: `${gs1}:certificationInfo` })
        .expect(HttpStatus.OK);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      res.body.forEach((link: any) => {
        expect(link.linkType).toBe(`${gs1}:certificationInfo`);
      });
    });

    it('should filter responses by mimeType', async () => {
      const res = await request(baseUrl)
        .get('/resolver/links')
        .set(headers)
        .query({ ...listLinksQuery, mimeType: 'text/html' })
        .expect(HttpStatus.OK);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      res.body.forEach((link: any) => {
        expect(link.mimeType).toBe('text/html');
      });
    });

    it('should filter responses by ianaLanguage', async () => {
      const res = await request(baseUrl)
        .get('/resolver/links')
        .set(headers)
        .query({ ...listLinksQuery, ianaLanguage: 'en' })
        .expect(HttpStatus.OK);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      res.body.forEach((link: any) => {
        expect(link.ianaLanguage).toBe('en');
      });
    });

    it('should return narrowed results when multiple filters are applied', async () => {
      const res = await request(baseUrl)
        .get('/resolver/links')
        .set(headers)
        .query({
          ...listLinksQuery,
          linkType: `${gs1}:certificationInfo`,
          mimeType: 'application/json',
        })
        .expect(HttpStatus.OK);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      res.body.forEach((link: any) => {
        expect(link.linkType).toBe(`${gs1}:certificationInfo`);
        expect(link.mimeType).toBe('application/json');
      });
    });

    it('should return empty array when filter matches no responses', async () => {
      const res = await request(baseUrl)
        .get('/resolver/links')
        .set(headers)
        .query({ ...listLinksQuery, linkType: 'nonexistent:linkType' })
        .expect(HttpStatus.OK);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it('should default qualifierPath to / when not provided', async () => {
      const res = await request(baseUrl)
        .get('/resolver/links')
        .set(headers)
        .query({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '09359502000010',
        })
        .expect(HttpStatus.OK);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /resolver/links/:linkId (Get Link by ID)', () => {
    it('should retrieve a specific link by its linkId', async () => {
      // First, list links to obtain a valid linkId
      const listRes = await request(baseUrl)
        .get('/resolver/links')
        .set(headers)
        .query(listLinksQuery)
        .expect(HttpStatus.OK);

      const linkId = listRes.body[0].linkId;

      const getRes = await request(baseUrl)
        .get(`/resolver/links/${linkId}`)
        .set(headers)
        .expect(HttpStatus.OK);

      expect(getRes.body.linkId).toBe(linkId);
      expect(getRes.body.targetUrl).toBeDefined();
      expect(getRes.body.linkType).toBeDefined();
      expect(getRes.body.title).toBeDefined();
    });

    it('should return 404 for a non-existent linkId', async () => {
      await request(baseUrl)
        .get('/resolver/links/non-existent-link-id')
        .set(headers)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('Additive Registration via POST /resolver', () => {
    it('should add new links to an existing identifier', async () => {
      // Count links before adding
      const beforeRes = await request(baseUrl)
        .get('/resolver/links')
        .set(headers)
        .query(listLinksQuery)
        .expect(HttpStatus.OK);

      const countBefore = beforeRes.body.length;

      // Add a new link via POST /resolver
      await request(baseUrl)
        .post('/resolver')
        .set(headers)
        .send({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '09359502000010',
          itemDescription: 'Test Product',
          qualifierPath: '/',
          active: true,
          responses: [
            {
              defaultLinkType: false,
              defaultMimeType: false,
              defaultIanaLanguage: false,
              defaultContext: false,
              fwqs: false,
              active: true,
              linkType: `${gs1}:epcis`,
              ianaLanguage: 'en',
              context: 'au',
              title: 'EPCIS Information',
              targetUrl: 'https://example.com/new-link',
              mimeType: 'application/json',
            },
          ],
        })
        .expect(HttpStatus.CREATED);

      // Verify the link count increased
      const afterRes = await request(baseUrl)
        .get('/resolver/links')
        .set(headers)
        .query(listLinksQuery)
        .expect(HttpStatus.OK);

      expect(afterRes.body.length).toBe(countBefore + 1);

      // Verify the new link can be found
      const newLink = afterRes.body.find(
        (link: any) => link.targetUrl === 'https://example.com/new-link',
      );
      expect(newLink).toBeDefined();
      expect(newLink.linkId).toBeDefined();
      expect(newLink.title).toBe('EPCIS Information');
    });

    it('should return the additively-added link when fetched by linkId', async () => {
      // Add a link with a unique URL
      await request(baseUrl)
        .post('/resolver')
        .set(headers)
        .send({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '09359502000010',
          itemDescription: 'Test Product',
          qualifierPath: '/',
          active: true,
          responses: [
            {
              defaultLinkType: false,
              defaultMimeType: false,
              defaultIanaLanguage: false,
              defaultContext: false,
              fwqs: false,
              active: true,
              linkType: `${gs1}:recipeInfo`,
              ianaLanguage: 'en',
              context: 'au',
              title: 'Recipe Information',
              targetUrl: 'https://example.com/fetchable-link',
              mimeType: 'text/html',
            },
          ],
        })
        .expect(HttpStatus.CREATED);

      // Find the link by targetUrl
      const listRes = await request(baseUrl)
        .get('/resolver/links')
        .set(headers)
        .query(listLinksQuery)
        .expect(HttpStatus.OK);

      const addedLink = listRes.body.find(
        (link: any) => link.targetUrl === 'https://example.com/fetchable-link',
      );
      expect(addedLink).toBeDefined();

      // Fetch by linkId
      const getRes = await request(baseUrl)
        .get(`/resolver/links/${addedLink.linkId}`)
        .set(headers)
        .expect(HttpStatus.OK);

      expect(getRes.body.linkId).toBe(addedLink.linkId);
      expect(getRes.body.targetUrl).toBe('https://example.com/fetchable-link');
      expect(getRes.body.title).toBe('Recipe Information');
    });
  });

  describe('PUT /resolver/links/:linkId (Update a Link)', () => {
    let targetLinkId: string;

    beforeAll(async () => {
      // Add a link via POST /resolver specifically for update tests
      await request(baseUrl)
        .post('/resolver')
        .set(headers)
        .send({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '09359502000010',
          itemDescription: 'Test Product',
          qualifierPath: '/',
          active: true,
          responses: [
            {
              defaultLinkType: false,
              defaultMimeType: false,
              defaultIanaLanguage: false,
              defaultContext: false,
              fwqs: false,
              active: true,
              targetUrl: 'https://example.com/to-update',
              linkType: `${gs1}:hasRetailers`,
              title: 'Original Title',
              mimeType: 'text/html',
              ianaLanguage: 'en',
              context: 'au',
            },
          ],
        })
        .expect(HttpStatus.CREATED);

      // Find the linkId by listing links and matching the unique targetUrl
      const listRes = await request(baseUrl)
        .get('/resolver/links')
        .set(headers)
        .query({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '09359502000010',
          qualifierPath: '/',
        })
        .expect(HttpStatus.OK);

      const addedLink = listRes.body.find(
        (link: any) => link.targetUrl === 'https://example.com/to-update',
      );
      targetLinkId = addedLink.linkId;
    });

    it('should update the title of an existing link', async () => {
      await request(baseUrl)
        .put(`/resolver/links/${targetLinkId}`)
        .set(headers)
        .send({ title: 'Updated Title' })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.message).toBe('Link updated successfully');
        });

      // Verify the title was changed
      const getRes = await request(baseUrl)
        .get(`/resolver/links/${targetLinkId}`)
        .set(headers)
        .expect(HttpStatus.OK);

      expect(getRes.body.title).toBe('Updated Title');
    });

    it('should update the targetUrl of an existing link', async () => {
      const newUrl = 'https://example.com/updated-target';

      await request(baseUrl)
        .put(`/resolver/links/${targetLinkId}`)
        .set(headers)
        .send({ targetUrl: newUrl })
        .expect(HttpStatus.OK);

      const getRes = await request(baseUrl)
        .get(`/resolver/links/${targetLinkId}`)
        .set(headers)
        .expect(HttpStatus.OK);

      expect(getRes.body.targetUrl).toBe(newUrl);
    });

    it('should update multiple fields at once', async () => {
      await request(baseUrl)
        .put(`/resolver/links/${targetLinkId}`)
        .set(headers)
        .send({
          title: 'Multi-field Update',
          mimeType: 'application/json',
          ianaLanguage: 'fr',
          context: 'ca',
        })
        .expect(HttpStatus.OK);

      const getRes = await request(baseUrl)
        .get(`/resolver/links/${targetLinkId}`)
        .set(headers)
        .expect(HttpStatus.OK);

      expect(getRes.body.title).toBe('Multi-field Update');
      expect(getRes.body.mimeType).toBe('application/json');
      expect(getRes.body.ianaLanguage).toBe('fr');
      expect(getRes.body.context).toBe('ca');
    });

    it('should return 404 when updating a non-existent linkId', async () => {
      await request(baseUrl)
        .put('/resolver/links/non-existent-link-id')
        .set(headers)
        .send({ title: 'Should Fail' })
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /resolver/links/:linkId (Soft-Delete)', () => {
    let softDeleteLinkId: string;

    beforeAll(async () => {
      // Add a link via POST /resolver specifically for soft-delete testing
      await request(baseUrl)
        .post('/resolver')
        .set(headers)
        .send({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '09359502000010',
          itemDescription: 'Test Product',
          qualifierPath: '/',
          active: true,
          responses: [
            {
              defaultLinkType: false,
              defaultMimeType: false,
              defaultIanaLanguage: false,
              defaultContext: false,
              fwqs: false,
              active: true,
              targetUrl: 'https://example.com/to-soft-delete',
              linkType: `${gs1}:masterData`,
              title: 'Soft Delete Target',
              mimeType: 'text/html',
              ianaLanguage: 'en',
              context: 'au',
            },
          ],
        })
        .expect(HttpStatus.CREATED);

      // Find the linkId by listing links and matching the unique targetUrl
      const listRes = await request(baseUrl)
        .get('/resolver/links')
        .set(headers)
        .query({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '09359502000010',
          qualifierPath: '/',
        })
        .expect(HttpStatus.OK);

      const addedLink = listRes.body.find(
        (link: any) => link.targetUrl === 'https://example.com/to-soft-delete',
      );
      softDeleteLinkId = addedLink.linkId;
    });

    it('should soft-delete a link (set active to false)', async () => {
      const deleteRes = await request(baseUrl)
        .delete(`/resolver/links/${softDeleteLinkId}`)
        .set(headers)
        .expect(HttpStatus.OK);

      expect(deleteRes.body.message).toBe('Link deleted successfully');
    });

    it('should include soft-deleted link in listing with active=false', async () => {
      const listRes = await request(baseUrl)
        .get('/resolver/links')
        .set(headers)
        .query(listLinksQuery)
        .expect(HttpStatus.OK);

      const deletedLink = listRes.body.find(
        (link: any) => link.linkId === softDeleteLinkId,
      );
      expect(deletedLink).toBeDefined();
      expect(deletedLink.active).toBe(false);
    });

    it('should still return the soft-deleted link when fetched directly by linkId', async () => {
      const getRes = await request(baseUrl)
        .get(`/resolver/links/${softDeleteLinkId}`)
        .set(headers)
        .expect(HttpStatus.OK);

      expect(getRes.body.linkId).toBe(softDeleteLinkId);
      expect(getRes.body.active).toBe(false);
    });
  });

  describe('DELETE /resolver/links/:linkId?hard=true (Hard-Delete)', () => {
    let hardDeleteLinkId: string;

    beforeAll(async () => {
      // Add a link via POST /resolver specifically for hard-delete testing
      await request(baseUrl)
        .post('/resolver')
        .set(headers)
        .send({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '09359502000010',
          itemDescription: 'Test Product',
          qualifierPath: '/',
          active: true,
          responses: [
            {
              defaultLinkType: false,
              defaultMimeType: false,
              defaultIanaLanguage: false,
              defaultContext: false,
              fwqs: false,
              active: true,
              targetUrl: 'https://example.com/to-hard-delete',
              linkType: `${gs1}:quickStartGuide`,
              title: 'Hard Delete Target',
              mimeType: 'text/html',
              ianaLanguage: 'en',
              context: 'au',
            },
          ],
        })
        .expect(HttpStatus.CREATED);

      // Find the linkId by listing links and matching the unique targetUrl
      const listRes = await request(baseUrl)
        .get('/resolver/links')
        .set(headers)
        .query({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '09359502000010',
          qualifierPath: '/',
        })
        .expect(HttpStatus.OK);

      const addedLink = listRes.body.find(
        (link: any) => link.targetUrl === 'https://example.com/to-hard-delete',
      );
      hardDeleteLinkId = addedLink.linkId;
    });

    it('should hard-delete a link permanently', async () => {
      const deleteRes = await request(baseUrl)
        .delete(`/resolver/links/${hardDeleteLinkId}`)
        .set(headers)
        .query({ hard: 'true' })
        .expect(HttpStatus.OK);

      expect(deleteRes.body.message).toBe('Link deleted successfully');
    });

    it('should return 404 when fetching a hard-deleted link by linkId', async () => {
      await request(baseUrl)
        .get(`/resolver/links/${hardDeleteLinkId}`)
        .set(headers)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('Version Tracking', () => {
    it('should set updatedAt on a link after an update', async () => {
      // Add a link via POST /resolver to update
      await request(baseUrl)
        .post('/resolver')
        .set(headers)
        .send({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '09359502000010',
          itemDescription: 'Test Product',
          qualifierPath: '/',
          active: true,
          responses: [
            {
              defaultLinkType: false,
              defaultMimeType: false,
              defaultIanaLanguage: false,
              defaultContext: false,
              fwqs: false,
              active: true,
              targetUrl: 'https://example.com/version-track',
              linkType: `${gs1}:traceability`,
              title: 'Version Track Test',
              mimeType: 'text/html',
              ianaLanguage: 'en',
              context: 'au',
            },
          ],
        })
        .expect(HttpStatus.CREATED);

      // Find the linkId by listing links and matching the unique targetUrl
      const listRes = await request(baseUrl)
        .get('/resolver/links')
        .set(headers)
        .query({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '09359502000010',
          qualifierPath: '/',
        })
        .expect(HttpStatus.OK);

      const addedLink = listRes.body.find(
        (link: any) => link.targetUrl === 'https://example.com/version-track',
      );
      const linkId = addedLink.linkId;

      // Fetch before update
      const beforeRes = await request(baseUrl)
        .get(`/resolver/links/${linkId}`)
        .set(headers)
        .expect(HttpStatus.OK);

      const createdAt = beforeRes.body.createdAt;
      expect(createdAt).toBeDefined();

      // Wait briefly to ensure timestamps differ
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Perform an update
      await request(baseUrl)
        .put(`/resolver/links/${linkId}`)
        .set(headers)
        .send({ title: 'Version Track Updated' })
        .expect(HttpStatus.OK);

      // Fetch after update
      const afterRes = await request(baseUrl)
        .get(`/resolver/links/${linkId}`)
        .set(headers)
        .expect(HttpStatus.OK);

      expect(afterRes.body.updatedAt).toBeDefined();
      expect(afterRes.body.createdAt).toBe(createdAt);
      // updatedAt should be equal to or later than createdAt
      expect(
        new Date(afterRes.body.updatedAt).getTime(),
      ).toBeGreaterThanOrEqual(new Date(createdAt).getTime());
    });
  });

  describe('Backward Compatibility', () => {
    it('should still register links via POST /resolver and list them with linkIds', async () => {
      // Create a separate namespace for this test to avoid interference
      const bcNamespace = `e2e-${environment}-link-mgmt-bc`;
      const bcIdentifierDto = createIdentifierDto();
      bcIdentifierDto.namespace = bcNamespace;

      await request(baseUrl)
        .post('/identifiers')
        .set('Authorization', `Bearer ${apiKey}`)
        .send(bcIdentifierDto)
        .expect(HttpStatus.OK);

      // Register a link resolver via the existing POST /resolver endpoint
      await request(baseUrl)
        .post('/resolver')
        .set(headers)
        .send({
          namespace: bcNamespace,
          identificationKeyType: 'gtin',
          identificationKey: '09359502000010',
          itemDescription: 'Backward Compat Product',
          qualifierPath: '/',
          active: true,
          responses: [
            {
              defaultLinkType: true,
              defaultMimeType: true,
              defaultIanaLanguage: true,
              defaultContext: true,
              fwqs: false,
              active: true,
              linkType: `${bcNamespace}:certificationInfo`,
              ianaLanguage: 'en',
              context: 'au',
              title: 'BC Certification Info',
              targetUrl: 'https://example.com/bc-cert',
              mimeType: 'application/json',
            },
          ],
        })
        .expect(HttpStatus.CREATED);

      // List links via the new management endpoint
      const listRes = await request(baseUrl)
        .get('/resolver/links')
        .set(headers)
        .query({
          namespace: bcNamespace,
          identificationKeyType: 'gtin',
          identificationKey: '09359502000010',
          qualifierPath: '/',
        })
        .expect(HttpStatus.OK);

      expect(Array.isArray(listRes.body)).toBe(true);
      expect(listRes.body.length).toBeGreaterThanOrEqual(1);
      listRes.body.forEach((link: any) => {
        expect(link.linkId).toBeDefined();
        expect(typeof link.linkId).toBe('string');
      });

      // Clean up the backward compatibility namespace
      await request(baseUrl)
        .delete('/identifiers')
        .set('Authorization', `Bearer ${apiKey}`)
        .query({ namespace: bcNamespace })
        .expect(HttpStatus.OK);
    });
  });

  describe('UNTP Linkset Extensions', () => {
    let dppLinkId: string;

    it('should register a link with UNTP properties', async () => {
      await request(baseUrl)
        .post('/resolver')
        .set(headers)
        .send({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '09359502000010',
          itemDescription: 'Test Product',
          qualifierPath: '/',
          active: true,
          responses: [
            {
              defaultLinkType: false,
              defaultMimeType: false,
              defaultIanaLanguage: false,
              defaultContext: false,
              fwqs: false,
              active: true,
              linkType: `${gs1}:dpp`,
              ianaLanguage: 'en',
              context: 'au',
              title: 'Digital Product Passport',
              targetUrl: 'https://example.com/dpp',
              mimeType: 'application/json',
              encryptionMethod: EncryptionMethod.AES256,
              accessRole: [UntpAccessRole.Customer, UntpAccessRole.Regulator],
              method: 'POST',
            },
          ],
        })
        .expect(HttpStatus.CREATED);
    });

    it('should return UNTP properties when listing links', async () => {
      const res = await request(baseUrl)
        .get('/resolver/links')
        .set(headers)
        .query(listLinksQuery)
        .expect(HttpStatus.OK);

      const dppLink = res.body.find(
        (link: any) => link.targetUrl === 'https://example.com/dpp',
      );
      expect(dppLink).toBeDefined();
      expect(dppLink.encryptionMethod).toBe(EncryptionMethod.AES256);
      expect(dppLink.accessRole).toContain(UntpAccessRole.Customer);
      expect(dppLink.accessRole).toContain(UntpAccessRole.Regulator);
      expect(dppLink.method).toBe('POST');

      // Store the linkId for subsequent tests
      dppLinkId = dppLink.linkId;
    });

    it('should include UNTP properties in linkset JSON when resolving with linkType=all', async () => {
      const res = await request(baseUrl)
        .get(`/${gs1}/01/09359502000010?linkType=all`)
        .expect(200);

      const linkset = JSON.parse(res.text);
      expect(linkset.linkset).toBeDefined();
      expect(Array.isArray(linkset.linkset)).toBe(true);

      const linksetEntry = linkset.linkset[0];
      const dppKey = Object.keys(linksetEntry).find((key) =>
        key.includes('dpp'),
      );
      expect(dppKey).toBeDefined();

      const dppTargets = linksetEntry[dppKey!];
      expect(Array.isArray(dppTargets)).toBe(true);

      const dppTarget = dppTargets.find(
        (target: any) => target.href === 'https://example.com/dpp',
      );
      expect(dppTarget).toBeDefined();
      expect(dppTarget.encryptionMethod).toBe(EncryptionMethod.AES256);
      expect(dppTarget.accessRole).toEqual([
        UntpAccessRole.Customer,
        UntpAccessRole.Regulator,
      ]);
      expect(dppTarget.method).toBe('POST');
    });

    it('should update UNTP properties on a link', async () => {
      // Update the encryptionMethod
      await request(baseUrl)
        .put(`/resolver/links/${dppLinkId}`)
        .set(headers)
        .send({ encryptionMethod: EncryptionMethod.None })
        .expect(HttpStatus.OK);

      // Verify the update
      const getRes = await request(baseUrl)
        .get(`/resolver/links/${dppLinkId}`)
        .set(headers)
        .expect(HttpStatus.OK);

      expect(getRes.body.encryptionMethod).toBe(EncryptionMethod.None);
    });

    it('should include predecessor-version in linkset after targetUrl update', async () => {
      // Update the targetUrl to a new version
      await request(baseUrl)
        .put(`/resolver/links/${dppLinkId}`)
        .set(headers)
        .send({ targetUrl: 'https://example.com/dpp-v2' })
        .expect(HttpStatus.OK);

      // Resolve with linkType=all and check for predecessor-version
      const res = await request(baseUrl)
        .get(`/${gs1}/01/09359502000010?linkType=all`)
        .expect(200);

      const linkset = JSON.parse(res.text);
      const linksetEntry = linkset.linkset[0];

      // Find the dpp link type key
      const dppKey = Object.keys(linksetEntry).find((key) =>
        key.includes('dpp'),
      );
      expect(dppKey).toBeDefined();

      const dppTargets = linksetEntry[dppKey!];
      expect(Array.isArray(dppTargets)).toBe(true);

      // Find predecessor entries inside the dpp link type array
      const predecessors = dppTargets.filter(
        (entry: any) => entry.rel && entry.rel.includes('predecessor-version'),
      );
      expect(predecessors.length).toBeGreaterThanOrEqual(1);

      const oldVersionEntry = predecessors.find(
        (entry: any) => entry.href === 'https://example.com/dpp',
      );
      expect(oldVersionEntry).toBeDefined();
      expect(oldVersionEntry.rel).toContain('predecessor-version');
    });
  });

  describe('Authentication Required', () => {
    it('should return 401 when listing links without an auth token', async () => {
      await request(baseUrl)
        .get('/resolver/links')
        .query(listLinksQuery)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 when getting a link by ID without an auth token', async () => {
      await request(baseUrl)
        .get('/resolver/links/some-link-id')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 when updating a link without an auth token', async () => {
      await request(baseUrl)
        .put('/resolver/links/some-link-id')
        .send({ title: 'No Auth Update' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 when deleting a link without an auth token', async () => {
      await request(baseUrl)
        .delete('/resolver/links/some-link-id')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
