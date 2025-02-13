import { HttpStatus } from '@nestjs/common';
import { APP_ROUTE_PREFIX } from '../src/common/utils/config.utils';
import request from 'supertest';

const baseUrl = process.env.API_BASE_URL + APP_ROUTE_PREFIX;

describe('AppController (e2e)', () => {
  it('/ (GET)', async () => {
    const res = await request(baseUrl)
      .get('/health-check')
      .expect(HttpStatus.OK);
    expect(res.text).toEqual(JSON.stringify({ status: 'OK' }));
  });
});
