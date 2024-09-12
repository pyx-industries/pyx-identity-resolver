import { Inject, Injectable } from '@nestjs/common';
import { IdentifierDto } from './dto/identifier.dto';
import { I18nService } from 'nestjs-i18n';
import { IRepositoryProvider } from '../../repository/providers/provider.repository.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class IdentifierManagementService {
  private readonly identifierPath: string;

  constructor(
    @Inject('RepositoryProvider')
    private readonly repositoryProvider: IRepositoryProvider,
    private readonly i18n: I18nService,
    private configService: ConfigService,
  ) {
    this.identifierPath = this.configService.get<string>('IDENTIFIER_PATH');

    // Ensure the IDENTIFIER_PATH environment variable is set
    if (!this.identifierPath) {
      throw new Error('IDENTIFIER_PATH environment variable is not set');
    }
  }

  /**
   * Constructs the full path for an object based on the given object name.
   * @param objectName - The name of the object to construct the path for.
   * @returns The constructed path.
   */
  private constructPath(objectName: string): string {
    return `${this.identifierPath}/${objectName}`;
  }

  /**
   * Retrieves an identifier by namespace.
   * @param namespace - The namespace of the identifier to retrieve.
   * @returns A promise that resolves to the retrieved identifier.
   */
  async getIdentifier(namespace: string): Promise<IdentifierDto> {
    const path = this.constructPath(namespace);
    return await this.repositoryProvider.one(path);
  }

  /**
   * Retrieves all identifiers.
   * @returns A promise that resolves to the an array of identifier.
   */
  async getIdentifiers(): Promise<IdentifierDto[]> {
    const path = this.constructPath('');
    return await this.repositoryProvider.all(path);
  }

  /**
   * Saves an identifier to the repository.
   * @param namespace - The namespace of the identifier.
   * @param identifierDto - The identifier data to save.
   */
  private async saveIdentifier(
    namespace: string,
    identifierDto: IdentifierDto,
  ): Promise<void> {
    const path = this.constructPath(namespace);
    await this.repositoryProvider.save({
      id: path,
      ...identifierDto,
    });
  }

  /**
   * Deletes an identifier from the repository.
   * @param namespace - The namespace of the identifier to delete.
   */
  async deleteIdentifier(namespace: string): Promise<void> {
    const path = this.constructPath(namespace);
    await this.repositoryProvider.delete(path);
  }

  /**
   * Upserts an identifier. This method saves an identifier to the repository.
   * @param identifierDto - The identifier data to upsert.
   * @returns A promise that resolves to the upserted identifier or void.
   */
  async upsertIdentifier(
    identifierDto: IdentifierDto,
  ): Promise<IdentifierDto | void> {
    await this.saveIdentifier(identifierDto.namespace, identifierDto);
  }
}
