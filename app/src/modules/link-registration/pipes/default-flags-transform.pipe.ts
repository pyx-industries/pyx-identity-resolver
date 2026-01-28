import { PipeTransform } from '@nestjs/common';
import {
  CreateLinkRegistrationDto,
  Response,
} from '../dto/link-registration.dto';

/**
 * Pipe that ensures only one response has each default flag set to true within its scope.
 *
 * When a new response is registered with a default flag, this pipe automatically
 * unsets the flag on existing responses in the same scope.
 *
 * Scope definitions:
 * - defaultLinkType: entire registration (global)
 * - defaultIanaLanguage: per linkType
 * - defaultContext: per linkType + ianaLanguage
 * - defaultMimeType: per linkType + ianaLanguage + context
 *
 * Note: This auto-unset behavior is a convenience for the current API.
 * It should be reviewed and potentially changed to explicit behavior
 * when proper link CRUD operations are implemented.
 */
export class DefaultFlagsTransformPipe
  implements
    PipeTransform<CreateLinkRegistrationDto, CreateLinkRegistrationDto>
{
  transform(value: CreateLinkRegistrationDto): CreateLinkRegistrationDto {
    const responses = value.responses;
    if (!responses || responses.length === 0) {
      return value;
    }

    // Process responses in order - later responses with defaults will override earlier ones
    this.enforceUniqueDefaultLinkType(responses);
    this.enforceUniqueDefaultIanaLanguage(responses);
    this.enforceUniqueDefaultContext(responses);
    this.enforceUniqueDefaultMimeType(responses);

    return value;
  }

  /**
   * Ensures only one response has defaultLinkType: true across the entire registration.
   */
  private enforceUniqueDefaultLinkType(responses: Response[]): void {
    let lastDefaultIndex = -1;

    // Find the last response with defaultLinkType: true
    for (let i = 0; i < responses.length; i++) {
      if (responses[i].defaultLinkType) {
        lastDefaultIndex = i;
      }
    }

    // Unset all others
    if (lastDefaultIndex >= 0) {
      for (let i = 0; i < responses.length; i++) {
        if (i !== lastDefaultIndex && responses[i].defaultLinkType) {
          responses[i].defaultLinkType = false;
        }
      }
    }
  }

  /**
   * Ensures only one response has defaultIanaLanguage: true per linkType.
   */
  private enforceUniqueDefaultIanaLanguage(responses: Response[]): void {
    // Group by linkType and find last default for each group
    const lastDefaultByLinkType = new Map<string, number>();

    for (let i = 0; i < responses.length; i++) {
      if (responses[i].defaultIanaLanguage) {
        const key = this.normalizeKey(responses[i].linkType);
        lastDefaultByLinkType.set(key, i);
      }
    }

    // Unset all except the last in each group
    for (let i = 0; i < responses.length; i++) {
      if (responses[i].defaultIanaLanguage) {
        const key = this.normalizeKey(responses[i].linkType);
        const lastIndex = lastDefaultByLinkType.get(key);
        if (lastIndex !== undefined && i !== lastIndex) {
          responses[i].defaultIanaLanguage = false;
        }
      }
    }
  }

  /**
   * Ensures only one response has defaultContext: true per linkType + ianaLanguage.
   */
  private enforceUniqueDefaultContext(responses: Response[]): void {
    // Group by linkType + ianaLanguage and find last default for each group
    const lastDefaultByScope = new Map<string, number>();

    for (let i = 0; i < responses.length; i++) {
      if (responses[i].defaultContext) {
        const key = this.getScopeKeyForContext(responses[i]);
        lastDefaultByScope.set(key, i);
      }
    }

    // Unset all except the last in each group
    for (let i = 0; i < responses.length; i++) {
      if (responses[i].defaultContext) {
        const key = this.getScopeKeyForContext(responses[i]);
        const lastIndex = lastDefaultByScope.get(key);
        if (lastIndex !== undefined && i !== lastIndex) {
          responses[i].defaultContext = false;
        }
      }
    }
  }

  /**
   * Ensures only one response has defaultMimeType: true per linkType + ianaLanguage + context.
   */
  private enforceUniqueDefaultMimeType(responses: Response[]): void {
    // Group by linkType + ianaLanguage + context and find last default for each group
    const lastDefaultByScope = new Map<string, number>();

    for (let i = 0; i < responses.length; i++) {
      if (responses[i].defaultMimeType) {
        const key = this.getScopeKeyForMimeType(responses[i]);
        lastDefaultByScope.set(key, i);
      }
    }

    // Unset all except the last in each group
    for (let i = 0; i < responses.length; i++) {
      if (responses[i].defaultMimeType) {
        const key = this.getScopeKeyForMimeType(responses[i]);
        const lastIndex = lastDefaultByScope.get(key);
        if (lastIndex !== undefined && i !== lastIndex) {
          responses[i].defaultMimeType = false;
        }
      }
    }
  }

  private getScopeKeyForContext(response: Response): string {
    return `${this.normalizeKey(response.linkType)}|${this.normalizeKey(response.ianaLanguage)}`;
  }

  private getScopeKeyForMimeType(response: Response): string {
    return `${this.normalizeKey(response.linkType)}|${this.normalizeKey(response.ianaLanguage)}|${this.normalizeKey(response.context)}`;
  }

  private normalizeKey(value: string): string {
    return value?.toLowerCase() ?? '';
  }
}
