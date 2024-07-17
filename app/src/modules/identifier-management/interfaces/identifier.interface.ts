export enum IdentifierType {
  Identifier = 'I',
  Qualifier = 'Q',
  DataAttribute = 'D',
}

export type IdentifierParameter = {
  qualifier: string;
  id: string;
};

export type IdentifierParameters = {
  namespace: string;
  primary: IdentifierParameter;
  secondaries?: IdentifierParameter[];
};
