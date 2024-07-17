import { HttpStatus } from '@nestjs/common';
import request from 'supertest';

const baseUrl = process.env.RESOLVER_DOMAIN;

describe('AppController (e2e)', () => {
  it('/ (GET)', async () => {
    const res = await request(baseUrl)
      .get('/health-check')
      .expect(HttpStatus.OK);
    expect(res.text).toEqual(JSON.stringify({ status: 'OK' }));
  });
});
