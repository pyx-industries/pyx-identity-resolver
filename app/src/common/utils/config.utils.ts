import fs from 'fs';
import { join } from 'path';

const VERSION_FILE = 'version.json';

// The API_VERSION is set manually, it should be updated when having change impact on the API.
const getApiVersion = () => {
  const filePath = join(process.cwd(), '..', VERSION_FILE);
  const version = fs.readFileSync(filePath, 'utf8');
  const { apiVersion } = JSON.parse(version);

  if (!apiVersion) throw Error('API version not found');
  return apiVersion;
};

export const API_VERSION = getApiVersion();

export const APP_ROUTE_PREFIX = '/api/' + API_VERSION;
