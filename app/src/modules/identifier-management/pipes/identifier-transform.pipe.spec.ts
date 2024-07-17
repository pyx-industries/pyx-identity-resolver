import { Test, TestingModule } from '@nestjs/testing';
import { IdentifierTransformPipe } from '../pipes/identifier-transform.pipe';
import { IdentifierDto } from '../dto/identifier.dto';
import { IdentifierManagementService } from '../identifier-management.service';

describe('IdentifierTransformPipe', () => {
  let pipe: IdentifierTransformPipe;
  let identifierManagementService: IdentifierManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdentifierTransformPipe,
        {
          provide: IdentifierManagementService,
          useValue: {
            getIdentifier: jest.fn(),
          },
        },
      ],
    }).compile();

    pipe = module.get<IdentifierTransformPipe>(IdentifierTransformPipe);
    identifierManagementService = module.get<IdentifierManagementService>(
      IdentifierManagementService,
    );
  });

  describe('transform', () => {
    it('should update entry value with the existing value', async () => {
      jest
        .spyOn(identifierManagementService, 'getIdentifier')
        .mockResolvedValue({
          namespace: 'testNamespace',
          applicationIdentifiers: [
            {
              ai: '01',
              shortcode: 'test',
              regex: '^.*$',
              type: 'I',
              qualifiers: ['10'],
              title: '',
              label: '',
            },
            {
              ai: '10',
              regex: '^.*$',
              type: 'Q',
              title: '',
              label: '',
              shortcode: '',
            },
          ],
        });

      const identifierDto: IdentifierDto = {
        namespace: 'testNamespace',
        applicationIdentifiers: [
          {
            ai: '01',
            shortcode: 'test',
            regex: '^.*$',
            type: 'I',
            qualifiers: ['10', '11'],
            title: '',
            label: '',
          },
          {
            ai: '11',
            regex: '^.*$',
            type: 'Q',
            title: 'new title',
            label: '',
            shortcode: '',
          },
        ],
      };

      const result = await pipe.transform(identifierDto);

      expect(result).toEqual({
        namespace: 'testNamespace',
        applicationIdentifiers: [
          {
            ai: '01',
            shortcode: 'test',
            regex: '^.*$',
            type: 'I',
            qualifiers: ['10', '11'],
            title: '',
            label: '',
          },
          {
            ai: '10',
            regex: '^.*$',
            type: 'Q',
            title: '',
            label: '',
            shortcode: '',
          },
          {
            ai: '11',
            regex: '^.*$',
            type: 'Q',
            title: 'new title',
            label: '',
            shortcode: '',
          },
        ],
      });
    });
  });
});
