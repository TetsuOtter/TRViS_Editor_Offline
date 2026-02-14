/**
 * Repository Factory
 *
 * Creates and manages repository instances based on configuration.
 * Supports both localStorage and HTTP backends.
 */

import { IDataRepository, RepositoryConfig, IRepositoryFactory } from './types';
import { LocalStorageAdapter } from './adapters/LocalStorageAdapter';
import { HttpAdapter } from './adapters/HttpAdapter';

export class RepositoryFactory implements IRepositoryFactory {
  private static instance: RepositoryFactory;
  private repositories: Map<string, IDataRepository> = new Map();

  private constructor() {}

  static getInstance(): RepositoryFactory {
    if (!RepositoryFactory.instance) {
      RepositoryFactory.instance = new RepositoryFactory();
    }
    return RepositoryFactory.instance;
  }

  /**
   * Create a new repository instance
   * Caches instances by configuration key to avoid duplication
   */
  createRepository(config: RepositoryConfig): IDataRepository {
    const key = this.getConfigKey(config);

    // Return cached instance if exists
    if (this.repositories.has(key)) {
      return this.repositories.get(key)!;
    }

    let repository: IDataRepository;

    switch (config.type) {
      case 'localStorage':
        repository = new LocalStorageAdapter(config);
        break;
      case 'http':
        repository = new HttpAdapter(config);
        break;
      default:
        throw new Error(`Unknown repository type: ${config.type}`);
    }

    this.repositories.set(key, repository);
    return repository;
  }

  /**
   * Get or create default repository for localStorage
   */
  getDefaultRepository(): IDataRepository {
    return this.createRepository({
      type: 'localStorage',
      storageKey: 'trvis-projects',
    });
  }

  /**
   * Clear all cached repositories and optionally close them
   */
  async clearRepositories(): Promise<void> {
    for (const repository of this.repositories.values()) {
      await repository.close();
    }
    this.repositories.clear();
  }

  /**
   * Generate unique key from configuration
   */
  private getConfigKey(config: RepositoryConfig): string {
    if (config.type === 'localStorage') {
      return `localStorage:${config.storageKey || 'default'}`;
    } else if (config.type === 'http') {
      return `http:${config.baseUrl}`;
    }
    return 'unknown';
  }
}

// Export singleton instance
export const repositoryFactory = RepositoryFactory.getInstance();
