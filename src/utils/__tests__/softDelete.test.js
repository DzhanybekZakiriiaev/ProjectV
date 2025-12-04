import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  addSoftDeleteFilter,
  getCreateMetadata,
  getUpdateMetadata,
  getDeleteMetadata
} from '../softDelete.js';

describe('Soft Delete Utils', () => {
  describe('addSoftDeleteFilter', () => {
    it('should add deleted_at filter when no filter provided', () => {
      const result = addSoftDeleteFilter();
      
      expect(result).toEqual({
        deleted_at: { $exists: false }
      });
    });

    it('should add deleted_at filter to existing filter', () => {
      const filter = { status: 'active', age: { $gte: 21 } };
      const result = addSoftDeleteFilter(filter);
      
      expect(result).toEqual({
        status: 'active',
        age: { $gte: 21 },
        deleted_at: { $exists: false }
      });
    });

    it('should preserve existing filter properties', () => {
      const filter = {
        name: 'test',
        category: { $in: ['A', 'B'] },
        score: { $gt: 100 }
      };
      const result = addSoftDeleteFilter(filter);
      
      expect(result).toHaveProperty('name', 'test');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('deleted_at', { $exists: false });
    });

    it('should handle empty object filter', () => {
      const result = addSoftDeleteFilter({});
      
      expect(result).toEqual({
        deleted_at: { $exists: false }
      });
    });
  });

  describe('getCreateMetadata', () => {
    it('should return created_at and created_by from user', () => {
      const user = { username: 'testuser', email: 'test@example.com' };
      const metadata = getCreateMetadata(user);
      
      expect(metadata).toHaveProperty('created_at');
      expect(metadata).toHaveProperty('created_by', 'testuser');
      expect(metadata.created_at).toBeInstanceOf(Date);
    });

    it('should use system as created_by when user is not provided', () => {
      const metadata = getCreateMetadata(null);
      
      expect(metadata).toHaveProperty('created_at');
      expect(metadata).toHaveProperty('created_by', 'system');
    });

    it('should use system as created_by when user has no username', () => {
      const metadata = getCreateMetadata({});
      
      expect(metadata).toHaveProperty('created_by', 'system');
    });
  });

  describe('getUpdateMetadata', () => {
    it('should return updated_at and updated_by from user', () => {
      const user = { username: 'testuser', email: 'test@example.com' };
      const metadata = getUpdateMetadata(user);
      
      expect(metadata).toHaveProperty('updated_at');
      expect(metadata).toHaveProperty('updated_by', 'testuser');
      expect(metadata.updated_at).toBeInstanceOf(Date);
    });

    it('should use system as updated_by when user is not provided', () => {
      const metadata = getUpdateMetadata(null);
      
      expect(metadata).toHaveProperty('updated_at');
      expect(metadata).toHaveProperty('updated_by', 'system');
    });

    it('should use system as updated_by when user has no username', () => {
      const metadata = getUpdateMetadata({});
      
      expect(metadata).toHaveProperty('updated_by', 'system');
    });
  });

  describe('getDeleteMetadata', () => {
    it('should return deleted_at and deleted_by from user', () => {
      const user = { username: 'testuser', email: 'test@example.com' };
      const metadata = getDeleteMetadata(user);
      
      expect(metadata).toHaveProperty('deleted_at');
      expect(metadata).toHaveProperty('deleted_by', 'testuser');
      expect(metadata.deleted_at).toBeInstanceOf(Date);
    });

    it('should use system as deleted_by when user is not provided', () => {
      const metadata = getDeleteMetadata(null);
      
      expect(metadata).toHaveProperty('deleted_at');
      expect(metadata).toHaveProperty('deleted_by', 'system');
    });

    it('should use system as deleted_by when user has no username', () => {
      const metadata = getDeleteMetadata({});
      
      expect(metadata).toHaveProperty('deleted_by', 'system');
    });
  });
});

