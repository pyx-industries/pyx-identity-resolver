/**
 * This function is used to append or override the elements of an array based on the unique key.
 * @param currentArray - The current array.
 * @param entryArray - The array to be appended or override.
 * @param getUniqueKey - The function to get the unique key.
 * @returns The updated array.
 * @template T - The type of the array.
 */
export function appendOrOverrideForArrayChanges<T>(
  currentArray: T[],
  entryArray: T[],
  getUniqueKey: (entry: T) => string,
): T[] {
  const updatedArrayMap = new Map<string, T>();
  for (const item of [...currentArray, ...entryArray]) {
    const uniqueKey = getUniqueKey(item);
    updatedArrayMap.set(uniqueKey, item);
  }

  const updatedArray: T[] = Array.from(updatedArrayMap.values());

  return updatedArray;
}
