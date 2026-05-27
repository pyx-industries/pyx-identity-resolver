import { deriveRoutePrefix } from './config.utils';

describe('deriveRoutePrefix', () => {
  it('returns /api/v<MAJOR> for a standard MAJOR.MINOR value', () => {
    expect(deriveRoutePrefix('4.0')).toBe('/api/v4');
    expect(deriveRoutePrefix('4.7')).toBe('/api/v4');
    expect(deriveRoutePrefix('10.3')).toBe('/api/v10');
  });

  it('accepts a major-only value', () => {
    expect(deriveRoutePrefix('5')).toBe('/api/v5');
  });

  it('strips a stray leading "v" so apiVersion="v4.0" still resolves to /api/v4', () => {
    expect(deriveRoutePrefix('v4.0')).toBe('/api/v4');
    expect(deriveRoutePrefix('V4')).toBe('/api/v4');
  });

  it('ignores patch and pre-release suffixes on the MAJOR.MINOR field', () => {
    expect(deriveRoutePrefix('4.0.1')).toBe('/api/v4');
    expect(deriveRoutePrefix('4.0-rc.1')).toBe('/api/v4');
  });

  it('throws when apiVersion is missing or empty', () => {
    expect(() => deriveRoutePrefix(undefined)).toThrow('API version not found');
    expect(() => deriveRoutePrefix('')).toThrow('API version not found');
    expect(() => deriveRoutePrefix('   ')).toThrow('API version not found');
  });

  it('throws when the major component cannot be extracted', () => {
    expect(() => deriveRoutePrefix('v')).toThrow(
      'API version "v" has no major component',
    );
  });
});
