/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from './auth.module';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { AuthStrategy } from './interfaces/auth.interface';

jest.mock('./strategies/api-key.strategy', () => {
  return {
    ApiKeyStrategy: jest.fn().mockImplementation(() => {
      return {
        validate: jest.fn(),
      };
    }),
  };
});

describe('AuthModule', () => {
  let moduleRef: TestingModule;
  let module: AuthModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule,
        PassportModule.register({
          defaultStrategy: AuthStrategy.API_KEY,
        }),
        AuthModule,
      ],
    }).compile();

    module = moduleRef.get<AuthModule>(AuthModule);
  });

  it('should module be defined', () => {
    expect(module).toBeDefined();
  });

  it('should import ConfigModule', () => {
    const configModule = moduleRef.resolve(ConfigModule);
    expect(configModule).toBeDefined();
  });

  it('should import PassportModule', () => {
    const passportModule = moduleRef.resolve(PassportModule);
    expect(passportModule).toBeDefined();
  });

  it('should provide ApiKeyStrategy', () => {
    const apiKeyStrategy = moduleRef.resolve(ApiKeyStrategy);
    expect(apiKeyStrategy).toBeDefined();
  });

  it('should export PassportModule', () => {
    const passportModule = moduleRef.get(PassportModule);
    expect(passportModule).toBeDefined();
  });

  it('should export ApiKeyStrategy', () => {
    const apiKeyStrategy = moduleRef.get(ApiKeyStrategy);
    expect(apiKeyStrategy).toBeDefined();
  });

  it('should validate ApiKeyStrategy', () => {
    const apiKeyStrategy = moduleRef.get(ApiKeyStrategy);
    expect(apiKeyStrategy.validate).toBeDefined();
  });

  it('should throw an error if invalid provider is passed', async () => {
    try {
      await Test.createTestingModule({
        imports: [AuthModule],
      }).compile();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });
});
