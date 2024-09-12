/**
 * A generic class to collect errors of any type.
 * @template T - The type of errors to collect.
 */
export class ErrorCollector<T> {
  private errors: T[] = [];

  /**
   * Adds a new error to the collector.
   * @param error - The error object to add.
   */
  addError(error: T): void {
    this.errors.push(error);
  }

  /**
   * Gets all collected errors.
   * @returns An array of collected errors.
   */
  getErrors(): T[] {
    return this.errors;
  }

  /**
   * Checks if there are any collected errors.
   * @returns True if there are errors, false otherwise.
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }
}
