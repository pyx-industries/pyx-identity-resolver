import { I18nService } from 'nestjs-i18n';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { LinkManagementController } from './link-management.controller';
import { LinkManagementService } from './link-management.service';
import { RepositoryModule } from '../../repository/repository.module';
import { IdentifierManagementService } from '../identifier-management/identifier-management.service';

describe('LinkManagementController', () => {
  let controller: LinkManagementController;
  let linkManagementService: LinkManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RepositoryModule, ConfigModule, HttpModule],
      controllers: [LinkManagementController],
      providers: [
        { provide: 'RepositoryProvider', useValue: { one: jest.fn() } },
        {
          provide: I18nService,
          useValue: {
            translate: jest.fn().mockImplementation((key) => key),
          },
        },
        {
          provide: LinkManagementService,
          useValue: {
            listLinks: jest.fn(),
            getLink: jest.fn(),
            updateLink: jest.fn(),
            softDeleteLink: jest.fn(),
            hardDeleteLink: jest.fn(),
          },
        },
        {
          provide: IdentifierManagementService,
          useValue: {
            getIdentifier: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<LinkManagementController>(LinkManagementController);
    linkManagementService = module.get<LinkManagementService>(
      LinkManagementService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listLinks', () => {
    it('should call service.listLinks with query params and return the result', async () => {
      const query = {
        namespace: 'gs1',
        identificationKeyType: 'gtin',
        identificationKey: '09359502000010',
        qualifierPath: '/',
      };
      const mockResult = [
        { linkId: 'abc123', targetUrl: 'https://example.com' },
      ];
      jest
        .spyOn(linkManagementService, 'listLinks')
        .mockResolvedValue(mockResult as any);

      const result = await controller.listLinks(query);

      expect(linkManagementService.listLinks).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getLink', () => {
    it('should call service.getLink with linkId and return the result', async () => {
      const linkId = 'abc123';
      const mockResult = {
        linkId: 'abc123',
        targetUrl: 'https://example.com',
        linkType: 'gs1:pip',
        title: 'Product Information Page',
      };
      jest
        .spyOn(linkManagementService, 'getLink')
        .mockResolvedValue(mockResult as any);

      const result = await controller.getLink(linkId);

      expect(linkManagementService.getLink).toHaveBeenCalledWith(linkId);
      expect(result).toEqual(mockResult);
    });
  });

  describe('updateLink', () => {
    it('should call service.updateLink with linkId and DTO and return the result', async () => {
      const linkId = 'abc123';
      const dto = {
        targetUrl: 'https://example.com/updated',
        title: 'Updated Title',
      };
      const mockResult = { message: 'Link updated successfully' };
      jest
        .spyOn(linkManagementService, 'updateLink')
        .mockResolvedValue(mockResult);

      const result = await controller.updateLink(linkId, dto as any);

      expect(linkManagementService.updateLink).toHaveBeenCalledWith(
        linkId,
        dto,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('deleteLink', () => {
    it('should call service.softDeleteLink when hard param is not provided', async () => {
      const linkId = 'abc123';
      const mockResult = { message: 'Link deleted successfully' };
      jest
        .spyOn(linkManagementService, 'softDeleteLink')
        .mockResolvedValue(mockResult);

      const result = await controller.deleteLink(linkId);

      expect(linkManagementService.softDeleteLink).toHaveBeenCalledWith(linkId);
      expect(linkManagementService.hardDeleteLink).not.toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should call service.hardDeleteLink when hard param is "true"', async () => {
      const linkId = 'abc123';
      const mockResult = { message: 'Link deleted successfully' };
      jest
        .spyOn(linkManagementService, 'hardDeleteLink')
        .mockResolvedValue(mockResult);

      const result = await controller.deleteLink(linkId, 'true');

      expect(linkManagementService.hardDeleteLink).toHaveBeenCalledWith(linkId);
      expect(linkManagementService.softDeleteLink).not.toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should call service.hardDeleteLink when hard param is "TRUE" (case insensitive)', async () => {
      const linkId = 'abc123';
      const mockResult = { message: 'Link deleted successfully' };
      jest
        .spyOn(linkManagementService, 'hardDeleteLink')
        .mockResolvedValue(mockResult);

      const result = await controller.deleteLink(linkId, 'TRUE');

      expect(linkManagementService.hardDeleteLink).toHaveBeenCalledWith(linkId);
      expect(linkManagementService.softDeleteLink).not.toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should call service.hardDeleteLink when hard param is "1"', async () => {
      const linkId = 'abc123';
      const mockResult = { message: 'Link deleted successfully' };
      jest
        .spyOn(linkManagementService, 'hardDeleteLink')
        .mockResolvedValue(mockResult);

      const result = await controller.deleteLink(linkId, '1');

      expect(linkManagementService.hardDeleteLink).toHaveBeenCalledWith(linkId);
      expect(linkManagementService.softDeleteLink).not.toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should call service.softDeleteLink when hard param is "false"', async () => {
      const linkId = 'abc123';
      const mockResult = { message: 'Link deleted successfully' };
      jest
        .spyOn(linkManagementService, 'softDeleteLink')
        .mockResolvedValue(mockResult);

      const result = await controller.deleteLink(linkId, 'false');

      expect(linkManagementService.softDeleteLink).toHaveBeenCalledWith(linkId);
      expect(linkManagementService.hardDeleteLink).not.toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });
});
