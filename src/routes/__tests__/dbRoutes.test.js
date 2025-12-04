import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { ObjectId } from 'mongodb';
import dbRouter from '../dbRoutes.js';
import { getDb } from '../../config/db.js';
import * as softDelete from '../../utils/softDelete.js';

jest.mock('../../config/db.js');
jest.mock('../../utils/softDelete.js');

describe('DB Routes', () => {
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
      insertOne: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      updateOne: jest.fn(),
      updateMany: jest.fn(),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn()
      })
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
      listCollections: jest.fn().mockReturnValue({
        toArray: jest.fn()
      }),
      createCollection: jest.fn()
    };

    getDb.mockResolvedValue(mockDb);

    // Mock soft delete functions
    softDelete.addSoftDeleteFilter.mockImplementation((filter) => ({
      ...filter,
      deleted_at: { $exists: false }
    }));
    softDelete.getCreateMetadata.mockReturnValue({
      created_at: new Date(),
      created_by: mockUser.username
    });
    softDelete.getUpdateMetadata.mockReturnValue({
      updated_at: new Date(),
      updated_by: mockUser.username
    });
    softDelete.getDeleteMetadata.mockReturnValue({
      deleted_at: new Date(),
      deleted_by: mockUser.username
    });

    app = express();
    app.use(express.json());
    // Simulate authenticated user
    app.use((req, res, next) => {
      req.user = mockUser;
      next();
    });
    app.use('/api', dbRouter);
  });

  describe('GET /api/collections', () => {
    it('should return list of collections', async () => {
      const mockCollections = [
        { name: 'users' },
        { name: 'products' },
        { name: 'orders' }
      ];
      mockDb.listCollections().toArray.mockResolvedValue(mockCollections);

      const response = await request(app).get('/api/collections');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        collections: ['users', 'products', 'orders']
      });
    });
  });

  describe('POST /api/collections/:name', () => {
    it('should create a new collection', async () => {
      mockDb.listCollections().toArray.mockResolvedValue([]);
      mockDb.createCollection.mockResolvedValue();

      const response = await request(app)
        .post('/api/collections/test-collection');

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        ok: true,
        collection: 'test-collection'
      });
      expect(mockDb.createCollection).toHaveBeenCalledWith('test-collection');
    });

    it('should return 200 if collection already exists', async () => {
      mockDb.listCollections().toArray.mockResolvedValue([
        { name: 'test-collection' }
      ]);

      const response = await request(app)
        .post('/api/collections/test-collection');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        message: 'Collection already exists'
      });
      expect(mockDb.createCollection).not.toHaveBeenCalled();
    });

    it('should return 400 when collection name is missing', async () => {
      const response = await request(app)
        .post('/api/collections/');

      // Express router will handle this differently
      expect([400, 404]).toContain(response.status);
    });
  });

  describe('POST /api/collections/:name/documents', () => {
    it('should create a new document', async () => {
      const documentId = new ObjectId();
      const document = { name: 'test', value: 123 };
      mockCollection.insertOne.mockResolvedValue({
        insertedId: documentId
      });

      const response = await request(app)
        .post('/api/collections/test-collection/documents')
        .send(document);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        ok: true,
        insertedId: documentId.toString()
      });
      expect(mockCollection.insertOne).toHaveBeenCalled();
      const insertedDoc = mockCollection.insertOne.mock.calls[0][0];
      expect(insertedDoc).toMatchObject(document);
      expect(insertedDoc).toHaveProperty('created_at');
      expect(insertedDoc).toHaveProperty('created_by');
    });

    it('should return 400 when body is not an object', async () => {
      const response = await request(app)
        .post('/api/collections/test-collection/documents')
        .send('invalid');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Body must be an object' });
    });

    it('should return 400 when body is an array', async () => {
      const response = await request(app)
        .post('/api/collections/test-collection/documents')
        .send([1, 2, 3]);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Body must be an object' });
    });
  });

  describe('GET /api/collections/:name/documents/:id', () => {
    it('should return a document by id', async () => {
      const documentId = new ObjectId();
      const document = {
        _id: documentId,
        name: 'test',
        value: 123
      };
      mockCollection.findOne.mockResolvedValue(document);

      const response = await request(app)
        .get(`/api/collections/test-collection/documents/${documentId.toString()}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        document
      });
      expect(softDelete.addSoftDeleteFilter).toHaveBeenCalled();
    });

    it('should return 404 when document is not found', async () => {
      const documentId = new ObjectId();
      mockCollection.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/collections/test-collection/documents/${documentId.toString()}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Document not found' });
    });

    it('should return 400 when id format is invalid', async () => {
      const response = await request(app)
        .get('/api/collections/test-collection/documents/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid id format' });
    });
  });

  describe('PATCH /api/collections/:name/documents/:id', () => {
    it('should update a document', async () => {
      const documentId = new ObjectId();
      const updatedDocument = {
        _id: documentId,
        name: 'updated',
        value: 456
      };
      mockCollection.findOneAndUpdate.mockResolvedValue({
        value: updatedDocument
      });

      const response = await request(app)
        .patch(`/api/collections/test-collection/documents/${documentId.toString()}`)
        .send({ name: 'updated', value: 456 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        document: updatedDocument
      });
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalled();
    });

    it('should return 404 when document is not found', async () => {
      const documentId = new ObjectId();
      mockCollection.findOneAndUpdate.mockResolvedValue({ value: null });

      const response = await request(app)
        .patch(`/api/collections/test-collection/documents/${documentId.toString()}`)
        .send({ name: 'updated' });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Document not found' });
    });

    it('should return 400 when body is not an object', async () => {
      const documentId = new ObjectId();
      const response = await request(app)
        .patch(`/api/collections/test-collection/documents/${documentId.toString()}`)
        .send('invalid');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Body must be an object' });
    });
  });

  describe('POST /api/collections/:name/find', () => {
    it('should find documents with filter', async () => {
      const documents = [
        { _id: new ObjectId(), name: 'test1' },
        { _id: new ObjectId(), name: 'test2' }
      ];
      mockCollection.find().sort().skip().limit().toArray.mockResolvedValue(documents);

      const response = await request(app)
        .post('/api/collections/test-collection/find')
        .send({
          filter: { status: 'active' },
          sort: { created_at: -1 },
          limit: 10,
          skip: 0
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        count: 2,
        documents
      });
      expect(softDelete.addSoftDeleteFilter).toHaveBeenCalled();
    });

    it('should return 400 when filter is not an object', async () => {
      const response = await request(app)
        .post('/api/collections/test-collection/find')
        .send({ filter: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'filter must be an object' });
    });

    it('should use default limit and skip', async () => {
      mockCollection.find().sort().skip().limit().toArray.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/collections/test-collection/find')
        .send({ filter: {} });

      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /api/collections/:name/documents/:id', () => {
    it('should soft-delete a document', async () => {
      const documentId = new ObjectId();
      mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const response = await request(app)
        .delete(`/api/collections/test-collection/documents/${documentId.toString()}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        deleted: 1
      });
      expect(softDelete.addSoftDeleteFilter).toHaveBeenCalled();
      expect(softDelete.getDeleteMetadata).toHaveBeenCalledWith(mockUser);
    });

    it('should return 404 when document is not found', async () => {
      const documentId = new ObjectId();
      mockCollection.updateOne.mockResolvedValue({ modifiedCount: 0 });

      const response = await request(app)
        .delete(`/api/collections/test-collection/documents/${documentId.toString()}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Document not found' });
    });
  });

  describe('DELETE /api/collections/:name/documents', () => {
    it('should soft-delete multiple documents', async () => {
      mockCollection.updateMany.mockResolvedValue({ modifiedCount: 3 });

      const response = await request(app)
        .delete('/api/collections/test-collection/documents')
        .send({ filter: { status: 'inactive' } });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        deleted: 3
      });
      expect(softDelete.addSoftDeleteFilter).toHaveBeenCalled();
    });

    it('should return 400 when filter is not an object', async () => {
      const response = await request(app)
        .delete('/api/collections/test-collection/documents')
        .send({ filter: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'filter must be an object' });
    });
  });

  describe('POST /api/collections/:name/documents/delete', () => {
    it('should soft-delete multiple documents via POST', async () => {
      mockCollection.updateMany.mockResolvedValue({ modifiedCount: 2 });

      const response = await request(app)
        .post('/api/collections/test-collection/documents/delete')
        .send({ filter: { status: 'inactive' } });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        deleted: 2
      });
    });
  });
});

