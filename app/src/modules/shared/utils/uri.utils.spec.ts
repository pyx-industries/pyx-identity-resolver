import { constructID, constructQualifiersFromQualifierPath } from './uri.utils';
import { LinkResolutionDto } from '../../link-resolution/dto/link-resolution.dto';

describe('constructID', () => {
  it('should construct uri ID with namespace and primary qualifier', () => {
    const identifierParams: LinkResolutionDto = {
      namespace: 'namespace-1',
      identifiers: {
        primary: {
          id: '123',
          qualifier: 'user',
        },
      },
    };

    const result = constructID(identifierParams);

    expect(result).toBe('namespace-1/user/123.json');
  });

  it('should construct uri ID with namespace, primary qualifier, and secondary qualifiers', () => {
    const identifierParams: LinkResolutionDto = {
      namespace: 'namespace-1',
      identifiers: {
        primary: {
          id: '123',
          qualifier: 'user',
        },
        secondaries: [
          {
            id: '456',
            qualifier: 'role',
          },
          {
            id: '789',
            qualifier: 'group',
          },
        ],
      },
    };

    const result = constructID(identifierParams);

    expect(result).toBe('namespace-1/user/123/role/456/group/789.json');
  });

  it('should throw an error when identifier parameters are invalid', () => {
    const identifierParams: LinkResolutionDto = {
      namespace: 'namespace-1',
      identifiers: {
        primary: null,
      },
    };

    expect(() => constructID(identifierParams)).toThrow(
      'Invalid identifier parameters',
    );
  });
});

describe('constructQualifiersFromQualifierPath', () => {
  it('should construct qualifiers from a qualifier path', () => {
    const qualifierPath = 'secondary1/456/secondary2/789';

    const result = constructQualifiersFromQualifierPath(qualifierPath);

    expect(result).toEqual([
      { qualifier: 'secondary1', id: '456' },
      { qualifier: 'secondary2', id: '789' },
    ]);
  });

  it('should construct qualifiers from a qualifier path is "/"', () => {
    const qualifierPath = '/';

    const result = constructQualifiersFromQualifierPath(qualifierPath);

    expect(result).toEqual([]);
  });

  it('should construct qualifiers from a qualifier path start with "/"', () => {
    const qualifierPath = '/secondary1/456/secondary2/789';

    const result = constructQualifiersFromQualifierPath(qualifierPath);

    expect(result).toEqual([
      { qualifier: 'secondary1', id: '456' },
      { qualifier: 'secondary2', id: '789' },
    ]);
  });

  it('should throw an error when the qualifier path is invalid', () => {
    const qualifierPath = 'secondary1/456/secondary2';

    expect(() => constructQualifiersFromQualifierPath(qualifierPath)).toThrow(
      'Invalid request data',
    );
  });
});
