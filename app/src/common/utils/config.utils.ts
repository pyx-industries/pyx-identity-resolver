import fs from 'fs';
import { join } from 'path';
import type { ConfigService } from '@nestjs/config';

const VERSION_FILE = 'version.json';

/**
 * Derives the URL path prefix served by the application from the value
 * stored in `version.json`'s `apiVersion` field.
 *
 * `apiVersion` is `MAJOR.MINOR` (for example `"4.0"`). The major
 * component drives the URL path (`/api/v<MAJOR>`); the minor component
 * documents backwards-compatible additions to the API surface and is
 * informational at runtime.
 *
 * Bump `apiVersion` only when the API contract changes. Patch and minor
 * service releases reuse the same `apiVersion` so client URLs and
 * stored linkset anchors survive non-breaking releases.
 *
 * @throws Error when `apiVersion` is missing, empty, or has no
 *   recognisable major component.
 */
export function deriveRoutePrefix(apiVersion: string | undefined): string {
  if (!apiVersion) {
    throw new Error('API version not found');
  }
  const trimmed = apiVersion.trim();
  if (!trimmed) {
    throw new Error('API version not found');
  }
  const major = trimmed.split('.')[0].replace(/^v/i, '');
  if (!major) {
    throw new Error(`API version "${apiVersion}" has no major component`);
  }
  return `/api/v${major}`;
}

/**
 * Reads `apiVersion` from `version.json` at the repository root.
 *
 * @see {@link deriveRoutePrefix} for the URL composition contract.
 */
const getApiVersion = (): string => {
  const filePath = join(process.cwd(), '..', VERSION_FILE);
  const version = fs.readFileSync(filePath, 'utf8');
  const { apiVersion } = JSON.parse(version);

  if (!apiVersion) throw Error('API version not found');
  return apiVersion;
};

export const API_VERSION = getApiVersion();

/**
 * The major component of {@link API_VERSION}. Used to build the URL
 * path prefix.
 */
export const API_MAJOR_VERSION = API_VERSION.split('.')[0];

/**
 * URL path prefix served by the application, e.g. `/api/v4`.
 *
 * Composed from the major component of `apiVersion`. The leading slash
 * lives here (not on `RESOLVER_DOMAIN`) so that callers can build full
 * URLs with `${RESOLVER_DOMAIN}${APP_ROUTE_PREFIX}/...` without worrying
 * about double slashes.
 */
export const APP_ROUTE_PREFIX = deriveRoutePrefix(API_VERSION);

/**
 * Composes the externally-reachable API base URL once, from the
 * deployment's `RESOLVER_DOMAIN` env var and the application's
 * {@link APP_ROUTE_PREFIX}. Every consumer that emits absolute URLs
 * (linkset anchors, Link response headers, the resolver description
 * file, the Swagger external `server` URL) MUST use this function
 * rather than recomposing the value itself; centralising the
 * concatenation is what prevents the double-prefix / dropped-prefix
 * footguns that the v4 URL model is structured to avoid.
 *
 * Returns e.g. `https://resolver.example.com/api/v4`.
 *
 * @throws Error when `RESOLVER_DOMAIN` is missing from the
 *   environment. Callers running inside a Nest request handler should
 *   prefer surfacing this as a 500 via the i18n exception helpers.
 */
export function buildApiBaseUrl(configService: ConfigService): string {
  const resolverBase = configService.get<string>('RESOLVER_DOMAIN');
  if (!resolverBase) {
    throw new Error('Missing configuration for RESOLVER_DOMAIN');
  }
  return `${resolverBase}${APP_ROUTE_PREFIX}`;
}
