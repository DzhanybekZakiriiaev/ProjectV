import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import actionsRouter from '../actionsRoutes.js';
import { getDb } from '../../config/db.js';

jest.mock('../../config/db.js');

describe('Actions Routes', () => {
  let app;
  let mockCollection;
  let mockDb;
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      username: 'testuser',
      email: 'test@example.com'
    };

    mockCollection = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn()
      })
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection)
    };

    getDb.mockResolvedValue(mockDb);

    app = express();
    app.use(express.json());
    // Simulate authenticated user
    app.use((req, res, next) => {
      req.user = mockUser;
      next();
    });
    app.use('/actions', actionsRouter);
  });

  describe('POST /actions/find', () => {
    it('should return actions with default parameters', async () => {
      const mockActions = [
        {
          _id: 'action1',
          username: 'testuser',
          method: 'GET',
          path: '/api/collections',
          timestamp: new Date()
        },
        {
          _id: 'action2',
          username: 'testuser',
          method: 'POST',
          path: '/api/collections/users/documents',
          timestamp: new Date()
        }
      ];

      mockCollection.find().sort().skip().limit().toArray.mockResolvedValue(mockActions);

      const response = await request(app)
        .post('/actions/find')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        count: 2,
        actions: mockActions
      });
      expect(mockDb.collection).toHaveBeenCalledWith('actions');
    });

    it('should find actions with custom filter', async () => {
      const mockActions = [
        {
          _id: 'action1',
          username: 'testuser',
          method: 'GET',
          path: '/api/collections'
        }
      ];

      mockCollection.find().sort().skip().limit().toArray.mockResolvedValue(mockActions);

      const response = await request(app)
        .post('/actions/find')
        .send({
          filter: { username: 'testuser' }
        });

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);
      expect(mockCollection.find).toHaveBeenCalledWith(
        { username: 'testuser' },
        { projection: undefined }
      );
    });

    it('should apply projection when provided', async () => {
      mockCollection.find().sort().skip().limit().toArray.mockResolvedValue([]);

      const response = await request(app)
        .post('/actions/find')
        .send({
          filter: {},
          projection: { username: 1, method: 1, timestamp: 1 }
        });

      expect(response.status).toBe(200);
      expect(mockCollection.find).toHaveBeenCalledWith(
        {},
        { projection: { username: 1, method: 1, timestamp: 1 } }
      );
    });

    it('should apply sort when provided', async () => {
      mockCollection.find().sort().skip().limit().toArray.mockResolvedValue([]);

      await request(app)
        .post('/actions/find')
        .send({
          filter: {},
          sort: { timestamp: -1 }
        });

      expect(mockCollection.find().sort).toHaveBeenCalledWith({ timestamp: -1 });
    });

    it('should use default sort when not provided', async () => {
      mockCollection.find().sort().skip().limit().toArray.mockResolvedValue([]);

      await request(app)
        .post('/actions/find')
        .send({
          filter: {}
        });

      expect(mockCollection.find().sort).toHaveBeenCalledWith({ timestamp: -1 });
    });

    it('should apply limit and skip', async () => {
      mockCollection.find().sort().skip().limit().toArray.mockResolvedValue([]);

      await request(app)
        .post('/actions/find')
        .send({
          filter: {},
          limit: 50,
          skip: 10
        });

      expect(mockCollection.find().sort().skip).toHaveBeenCalledWith(10);
      expect(mockCollection.find().sort().skip().limit).toHaveBeenCalledWith(50);
    });

    it('should use default limit and skip when not provided', async () => {
      mockCollection.find().sort().skip().limit().toArray.mockResolvedValue([]);

      await request(app)
        .post('/actions/find')
        .send({
          filter: {}
        });

      expect(mockCollection.find().sort().skip).toHaveBeenCalledWith(0);
      expect(mockCollection.find().sort().skip().limit).toHaveBeenCalledWith(100);
    });

    it('should cap limit at 1000', async () => {
      mockCollection.find().sort().skip().limit().toArray.mockResolvedValue([]);

      await request(app)
        .post('/actions/find')
        .send({
          filter: {},
          limit: 2000
        });

      expect(mockCollection.find().sort().skip().limit).toHaveBeenCalledWith(1000);
    });

    it('should return 400 when filter is not an object', async () => {
      const response = await request(app)
        .post('/actions/find')
        .send({
          filter: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'filter must be an object' });
    });

    it('should return 400 when filter is an array', async () => {
      const response = await request(app)
        .post('/actions/find')
        .send({
          filter: []
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'filter must be an object' });
    });

    it('should handle database errors', async () => {
      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const response = await request(app)
        .post('/actions/find')
        .send({
          filter: {}
        });

      expect(response.status).toBe(500);
    });
  });
});

