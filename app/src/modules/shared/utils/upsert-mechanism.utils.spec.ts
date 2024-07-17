import { appendOrOverrideForArrayChanges } from '../utils/upsert-mechanism.utils';

describe('appendOrOverrideForArrayChanges', () => {
  let currentArray: { id: string; value: string }[];
  let entryArray: { id: string; value: string }[];

  beforeEach(() => {
    currentArray = [
      { id: '1', value: 'A' },
      { id: '2', value: 'B' },
      { id: '3', value: 'C' },
    ];

    entryArray = [
      { id: '2', value: 'X' },
      { id: '4', value: 'Y' },
      { id: '5', value: 'Z' },
    ];
  });

  it('should override existing elements and append new elements in the current array', () => {
    const result = appendOrOverrideForArrayChanges(
      currentArray,
      entryArray,
      (entry) => entry.id,
    );
    expect(result).toEqual([
      { id: '1', value: 'A' },
      { id: '2', value: 'X' },
      { id: '3', value: 'C' },
      { id: '4', value: 'Y' },
      { id: '5', value: 'Z' },
    ]);
  });

  it('should return the current array if the entry array is empty', () => {
    const result = appendOrOverrideForArrayChanges(
      currentArray,
      [],
      (entry) => entry.id,
    );
    expect(result).toEqual(currentArray);
  });

  it('should return the entry array if the current array is empty', () => {
    const result = appendOrOverrideForArrayChanges(
      [],
      entryArray,
      (entry) => entry.id,
    );
    expect(result).toEqual(entryArray);
  });

  it('should return an empty array if both the current and entry arrays are empty', () => {
    const result = appendOrOverrideForArrayChanges([], [], (entry) => entry.id);
    expect(result).toEqual([]);
  });
});
