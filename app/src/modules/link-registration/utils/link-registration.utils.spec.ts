import { getObjectName } from '../utils/link-registration.utils';
import { CreateLinkRegistrationDto } from '../dto/link-registration.dto';

describe('getObjectName', () => {
  it('should return the object name based on the registration payload', () => {
    const payload: CreateLinkRegistrationDto = {
      namespace: 'testnamespace',
      identificationKeyType: 'testidentificationKeyType',
      identificationKey: 'testidentificationKey',
      itemDescription: '',
      qualifierPath: '/10/12345678901234567890',
      active: false,
      responses: [],
    };
    const aiCode = 'ABC123';

    const result = getObjectName(payload, aiCode);

    expect(result).toBe(
      '/testnamespace/ABC123/testidentificationKey/10/12345678901234567890.json',
    );
  });

  it('should return an empty string if the qualifier path is empty', () => {
    const payload: CreateLinkRegistrationDto = {
      namespace: 'testnamespace',
      identificationKeyType: 'testidentificationKeyType',
      identificationKey: 'testidentificationKey',
      itemDescription: '',
      qualifierPath: '',
      active: false,
      responses: [],
    };
    const aiCode = 'ABC123';

    const result = getObjectName(payload, aiCode);

    expect(result).toBe('/testnamespace/ABC123/testidentificationKey.json');
  });
});
