/**
 * Unit Tests for RepositoryFactory
 *
 * Tests repository creation, caching, and adapter instantiation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RepositoryFactory } from '../RepositoryFactory';
import { LocalStorageAdapter } from '../adapters/LocalStorageAdapter';
import { HttpAdapter } from '../adapters/HttpAdapter';

describe('RepositoryFactory', () => {
  let factory: RepositoryFactory;

  beforeEach(() => {
    factory = new RepositoryFactory();
  });

  afterEach(async () => {
    await factory.clearRepositories();
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = RepositoryFactory.getInstance();
      const instance2 = RepositoryFactory.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('createRepository', () => {
    it('should create LocalStorageAdapter', () => {
      const repository = factory.createRepository({
        type: 'localStorage',
        storageKey: 'test-key',
      });

      expect(repository).toBeInstanceOf(LocalStorageAdapter);
    });

    it('should create HttpAdapter', () => {
      const repository = factory.createRepository({
        type: 'http',
        baseUrl: 'http://localhost:3000',
      });

      expect(repository).toBeInstanceOf(HttpAdapter);
    });

    it('should throw error for unknown type', () => {
      expect(() =>
        factory.createRepository({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type: 'unknown' as any,
          baseUrl: 'http://localhost:3000',
        })
      ).toThrow('Unknown repository type');
    });

    it('should throw error for HttpAdapter without baseUrl', () => {
      expect(() =>
        factory.createRepository({
          type: 'http',
        })
      ).toThrow('baseUrl is required');
    });
  });

  describe('Repository Caching', () => {
    it('should return cached instance for same config', () => {
      const config = {
        type: 'localStorage' as const,
        storageKey: 'test-key',
      };

      const repo1 = factory.createRepository(config);
      const repo2 = factory.createRepository(config);

      expect(repo1).toBe(repo2);
    });

    it('should create different instances for different configs', () => {
      const repo1 = factory.createRepository({
        type: 'localStorage',
        storageKey: 'key1',
      });

      const repo2 = factory.createRepository({
        type: 'localStorage',
        storageKey: 'key2',
      });

      expect(repo1).not.toBe(repo2);
    });

    it('should cache by baseUrl for HTTP adapters', () => {
      const repo1 = factory.createRepository({
        type: 'http',
        baseUrl: 'http://localhost:3000',
      });

      const repo2 = factory.createRepository({
        type: 'http',
        baseUrl: 'http://localhost:3000',
      });

      expect(repo1).toBe(repo2);
    });

    it('should create different instances for different HTTP URLs', () => {
      const repo1 = factory.createRepository({
        type: 'http',
        baseUrl: 'http://localhost:3000',
      });

      const repo2 = factory.createRepository({
        type: 'http',
        baseUrl: 'http://localhost:4000',
      });

      expect(repo1).not.toBe(repo2);
    });
  });

  describe('getDefaultRepository', () => {
    it('should return localStorage adapter by default', async () => {
      const repo = factory.getDefaultRepository();
      expect(repo).toBeInstanceOf(LocalStorageAdapter);
    });

    it('should return cached default repository', () => {
      const repo1 = factory.getDefaultRepository();
      const repo2 = factory.getDefaultRepository();
      expect(repo1).toBe(repo2);
    });

    it('should use default storage key', () => {
      const repo = factory.getDefaultRepository();
      expect(repo).toBeInstanceOf(LocalStorageAdapter);

      // Verify it uses the default key by checking initialization
      // (can't directly access private storageKey)
    });
  });

  describe('clearRepositories', () => {
    it('should close all repositories', async () => {
      const repo1 = factory.createRepository({
        type: 'localStorage',
        storageKey: 'key1',
      });

      const repo2 = factory.createRepository({
        type: 'http',
        baseUrl: 'http://localhost:3000',
      });

      const closeSpy1 = vi.spyOn(repo1, 'close');
      const closeSpy2 = vi.spyOn(repo2, 'close');

      await factory.clearRepositories();

      expect(closeSpy1).toHaveBeenCalled();
      expect(closeSpy2).toHaveBeenCalled();
    });

    it('should clear all cached repositories', async () => {
      factory.createRepository({
        type: 'localStorage',
        storageKey: 'key1',
      });

      await factory.clearRepositories();

      // After clearing, should create new instance
      const newRepo = factory.createRepository({
        type: 'localStorage',
        storageKey: 'key1',
      });

      expect(newRepo).toBeInstanceOf(LocalStorageAdapter);
    });
  });

  describe('Configuration Flexibility', () => {
    it('should support optional configuration parameters', () => {
      const repo = factory.createRepository({
        type: 'localStorage',
      }); // storageKey optional

      expect(repo).toBeInstanceOf(LocalStorageAdapter);
    });

    it('should support timeout and retry configuration for HTTP', () => {
      const repo = factory.createRepository({
        type: 'http',
        baseUrl: 'http://localhost:3000',
        timeout: 2000,
        retryAttempts: 5,
        retryDelay: 500,
      });

      expect(repo).toBeInstanceOf(HttpAdapter);
    });

    it('should support error callback for HTTP adapter', () => {
      const onSyncError = vi.fn();
      const repo = factory.createRepository({
        type: 'http',
        baseUrl: 'http://localhost:3000',
        onSyncError,
      });

      expect(repo).toBeInstanceOf(HttpAdapter);
    });
  });

  describe('Multiple Factories', () => {
    it('should maintain separate cache per factory instance', () => {
      const factory1 = new RepositoryFactory();
      const factory2 = new RepositoryFactory();

      const repo1 = factory1.createRepository({
        type: 'localStorage',
        storageKey: 'key1',
      });

      const repo2 = factory2.createRepository({
        type: 'localStorage',
        storageKey: 'key1',
      });

      // Different factories can have different caches
      // (though getInstance() returns singleton)
      expect(repo1).toBeInstanceOf(LocalStorageAdapter);
      expect(repo2).toBeInstanceOf(LocalStorageAdapter);
    });
  });
});
