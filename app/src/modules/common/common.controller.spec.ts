import { Response } from 'express';
import { Test, TestingModule } from '@nestjs/testing';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';

describe('CommonController', () => {
  let commonController: CommonController;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let commonService: CommonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommonController],
      providers: [
        {
          provide: CommonService,
          useValue: {
            transformResolverData: jest.fn().mockResolvedValue('mocked data'),
            getLinkTypes: jest.fn().mockReturnValue('mocked link types'),
            getSpecificLinkType: jest
              .fn()
              .mockReturnValue('mocked specific link types'),
          },
        },
      ],
    }).compile();

    commonController = module.get<CommonController>(CommonController);
    commonService = module.get<CommonService>(CommonService);
  });

  it('should be defined', () => {
    expect(commonController).toBeDefined();
  });

  it('should get resolver data', async () => {
    const data = await commonController.getResolver();
    expect(data).toBe('mocked data');
  });

  it('should get voc data', () => {
    const res = { json: jest.fn(), redirect: jest.fn() } as unknown as Response;
    commonController.getVoc('linktypes', res);
    expect(res.json).toHaveBeenCalledWith('mocked link types');
  });

  it('should redirect if show is not linktypes', () => {
    const res = { json: jest.fn(), redirect: jest.fn() } as unknown as Response;
    commonController.getVoc('not linktypes', res);
    expect(res.redirect).toHaveBeenCalledWith('/voc/?show=linktypes');
  });

  it('should get voc with specific link type', () => {
    const res = { json: jest.fn() } as unknown as Response;
    commonController.getLinkType('epcis', res);
    expect(res.json).toHaveBeenCalledWith('mocked specific link types');
  });
});
