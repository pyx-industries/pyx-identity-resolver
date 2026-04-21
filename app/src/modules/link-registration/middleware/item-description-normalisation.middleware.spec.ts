import { Request, Response } from 'express';
import { ItemDescriptionNormalisationMiddleware } from './item-description-normalisation.middleware';

describe('ItemDescriptionNormalisationMiddleware', () => {
  let middleware: ItemDescriptionNormalisationMiddleware;
  let next: jest.Mock;

  const run = (body: unknown) => {
    const req = { body } as Request;
    middleware.use(req, {} as Response, next);
    return req.body;
  };

  beforeEach(() => {
    middleware = new ItemDescriptionNormalisationMiddleware();
    next = jest.fn();
  });

  it('copies itemDescription onto description when description is absent', () => {
    const body = run({ itemDescription: 'Legacy value' });
    expect(body).toEqual({
      description: 'Legacy value',
      itemDescription: 'Legacy value',
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('copies itemDescription onto description when description is null', () => {
    const body = run({ description: null, itemDescription: 'Legacy value' });
    expect((body as any).description).toBe('Legacy value');
  });

  it('preserves description when both fields are provided', () => {
    const body = run({
      description: 'Canonical',
      itemDescription: 'Legacy value',
    });
    expect((body as any).description).toBe('Canonical');
    expect((body as any).itemDescription).toBe('Legacy value');
  });

  it('does not overwrite an empty-string description with itemDescription', () => {
    // Empty string is an explicit caller-supplied value, not a missing field.
    // Downstream @IsNotEmpty validation will reject it with a clear error,
    // which is preferable to silently replacing it with the deprecated alias.
    const body = run({ description: '', itemDescription: 'Legacy value' });
    expect((body as any).description).toBe('');
    expect((body as any).itemDescription).toBe('Legacy value');
  });

  it('leaves the body untouched when itemDescription is absent', () => {
    const body = run({ description: 'Canonical' });
    expect(body).toEqual({ description: 'Canonical' });
  });

  it('leaves the body untouched when itemDescription is null', () => {
    const body = run({ itemDescription: null });
    expect(body).toEqual({ itemDescription: null });
  });

  it('calls next exactly once when the body is missing', () => {
    const req = {} as Request;
    middleware.use(req, {} as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('calls next exactly once when the body is not an object', () => {
    const req = { body: 'not-an-object' } as unknown as Request;
    middleware.use(req, {} as Response, next);
    expect(req.body).toBe('not-an-object');
    expect(next).toHaveBeenCalledTimes(1);
  });
});
