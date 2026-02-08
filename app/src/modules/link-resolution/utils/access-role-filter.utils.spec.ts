import { LinkResponse } from '../interfaces/uri.interface';
import {
  normaliseAccessRole,
  filterByAccessRole,
} from './access-role-filter.utils';

/**
 * Helper to build a minimal {@link LinkResponse} with only the fields
 * relevant to access-role filtering.
 */
const buildResponse = (
  overrides: Partial<LinkResponse> = {},
): LinkResponse => ({
  targetUrl: 'https://example.com',
  title: 'Example',
  linkType: 'gs1:pip',
  ianaLanguage: 'en',
  context: 'au',
  mimeType: 'application/json',
  active: true,
  fwqs: false,
  defaultLinkType: false,
  defaultIanaLanguage: false,
  defaultContext: false,
  defaultMimeType: false,
  ...overrides,
});

describe('normaliseAccessRole', () => {
  it('should map lowercase shorthand to full URI', () => {
    expect(normaliseAccessRole('customer')).toBe('untp:accessRole#Customer');
  });

  it('should map uppercase shorthand to full URI', () => {
    expect(normaliseAccessRole('CUSTOMER')).toBe('untp:accessRole#Customer');
  });

  it('should map mixed-case shorthand to full URI', () => {
    expect(normaliseAccessRole('Customer')).toBe('untp:accessRole#Customer');
  });

  it.each([
    ['anonymous', 'untp:accessRole#Anonymous'],
    ['regulator', 'untp:accessRole#Regulator'],
    ['recycler', 'untp:accessRole#Recycler'],
    ['auditor', 'untp:accessRole#Auditor'],
    ['owner', 'untp:accessRole#Owner'],
  ])('should normalise "%s" to %s', (shorthand, expectedUri) => {
    expect(normaliseAccessRole(shorthand)).toBe(expectedUri);
  });

  it('should pass through a full URI unchanged', () => {
    expect(normaliseAccessRole('untp:accessRole#Customer')).toBe(
      'untp:accessRole#Customer',
    );
  });

  it('should expand empty string using URI convention', () => {
    expect(normaliseAccessRole('')).toBe('untp:accessRole#');
  });

  it('should expand unknown shorthand using URI convention', () => {
    expect(normaliseAccessRole('unknownRole')).toBe(
      'untp:accessRole#Unknownrole',
    );
  });
});

describe('filterByAccessRole', () => {
  const publicResponse = buildResponse({ title: 'Public' });
  const emptyRoleResponse = buildResponse({
    title: 'EmptyRole',
    accessRole: [],
  });
  const customerResponse = buildResponse({
    title: 'Customer',
    accessRole: ['untp:accessRole#Customer'],
  });
  const regulatorResponse = buildResponse({
    title: 'Regulator',
    accessRole: ['untp:accessRole#Regulator'],
  });
  const multiRoleResponse = buildResponse({
    title: 'MultiRole',
    accessRole: ['untp:accessRole#Customer', 'untp:accessRole#Regulator'],
  });

  it('should return all responses when accessRole is undefined', () => {
    const responses = [publicResponse, customerResponse, regulatorResponse];
    const result = filterByAccessRole(responses, undefined);

    expect(result).toEqual(responses);
  });

  it('should return all responses when accessRole is an empty string', () => {
    const responses = [publicResponse, customerResponse, regulatorResponse];
    const result = filterByAccessRole(responses, '');

    expect(result).toEqual(responses);
  });

  it('should include responses with a matching accessRole using shorthand', () => {
    const responses = [customerResponse];
    const result = filterByAccessRole(responses, 'customer');

    expect(result).toEqual([customerResponse]);
  });

  it('should include public responses (no accessRole field)', () => {
    const responses = [publicResponse];
    const result = filterByAccessRole(responses, 'customer');

    expect(result).toEqual([publicResponse]);
  });

  it('should include responses with an empty accessRole array', () => {
    const responses = [emptyRoleResponse];
    const result = filterByAccessRole(responses, 'customer');

    expect(result).toEqual([emptyRoleResponse]);
  });

  it('should include responses with null accessRole', () => {
    const nullRoleResponse = buildResponse({
      title: 'NullRole',
      accessRole: null as unknown as string[],
    });
    const responses = [nullRoleResponse];
    const result = filterByAccessRole(responses, 'customer');

    expect(result).toEqual([nullRoleResponse]);
  });

  it('should exclude responses with a non-matching accessRole', () => {
    const responses = [regulatorResponse];
    const result = filterByAccessRole(responses, 'customer');

    expect(result).toEqual([]);
  });

  it('should return matching and public responses, excluding non-matching', () => {
    const responses = [
      publicResponse,
      emptyRoleResponse,
      customerResponse,
      regulatorResponse,
    ];
    const result = filterByAccessRole(responses, 'customer');

    expect(result).toEqual([
      publicResponse,
      emptyRoleResponse,
      customerResponse,
    ]);
  });

  it('should work with a full URI accessRole value', () => {
    const responses = [customerResponse, regulatorResponse];
    const result = filterByAccessRole(responses, 'untp:accessRole#Customer');

    expect(result).toEqual([customerResponse]);
  });

  it('should include responses where the accessRole array contains the role among others', () => {
    const responses = [multiRoleResponse];
    const result = filterByAccessRole(responses, 'customer');

    expect(result).toEqual([multiRoleResponse]);
  });
});
