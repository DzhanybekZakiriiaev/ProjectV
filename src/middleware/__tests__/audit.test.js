import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { EventEmitter } from 'events';
import { auditLog } from '../audit.js';
import { getDb } from '../../config/db.js';

jest.mock('../../config/db.js');

describe('Audit Middleware', () => {
  let req, res, next;
  let mockCollection;
  let mockDb;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockCollection = {
      insertOne: jest.fn().mockResolvedValue({ insertedId: 'test-id' })
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection)
    };

    getDb.mockResolvedValue(mockDb);

    req = {
      method: 'GET',
      originalUrl: '/api/collections',
      url: '/api/collections',
      params: {},
      query: { limit: '10' },
      body: {},
      user: {
        username: 'testuser',
        email: 'test@example.com'
      },
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
      headers: {
        'user-agent': 'test-agent'
      }
    };

    res = Object.assign(new EventEmitter(), {
      statusCode: 200,
      send: jest.fn()
    });

    next = jest.fn();
  });

  it('should call next immediately', () => {
    auditLog(req, res, next);
    
    expect(next).toHaveBeenCalled();
  });

  it('should log audit entry when response finishes', async () => {
    auditLog(req, res, next);
    
    // Emit finish event
    res.emit('finish');
    
    // Wait for async audit log
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(getDb).toHaveBeenCalled();
    expect(mockDb.collection).toHaveBeenCalledWith('actions');
    expect(mockCollection.insertOne).toHaveBeenCalled();
    
    const logEntry = mockCollection.insertOne.mock.calls[0][0];
    expect(logEntry).toMatchObject({
      username: 'testuser',
      email: 'test@example.com',
      method: 'GET',
      path: '/api/collections',
      params: {},
      query: { limit: '10' },
      body: {},
      statusCode: 200
    });
    expect(logEntry).toHaveProperty('timestamp');
    expect(logEntry).toHaveProperty('duration');
    expect(logEntry).toHaveProperty('ip');
    expect(logEntry).toHaveProperty('userAgent');
  });

  it('should handle anonymous user when req.user is missing', async () => {
    delete req.user;

    auditLog(req, res, next);
    res.emit('finish');
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const logEntry = mockCollection.insertOne.mock.calls[0][0];
    expect(logEntry.username).toBe('anonymous');
    expect(logEntry.email).toBeNull();
  });

  it('should calculate duration correctly', async () => {
    auditLog(req, res, next);
    res.emit('finish');
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const logEntry = mockCollection.insertOne.mock.calls[0][0];
    expect(logEntry.duration).toBeGreaterThanOrEqual(0);
    expect(logEntry.duration).toBeLessThan(100);
  });

  it('should handle audit log errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockCollection.insertOne.mockRejectedValue(new Error('DB error'));

    auditLog(req, res, next);
    res.emit('finish');
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Audit log error:',
      expect.any(String)
    );
    
    consoleErrorSpy.mockRestore();
  });

  it('should capture request body', async () => {
    req.body = { name: 'test', value: 123 };

    auditLog(req, res, next);
    res.emit('finish');
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const logEntry = mockCollection.insertOne.mock.calls[0][0];
    expect(logEntry.body).toEqual({ name: 'test', value: 123 });
  });

  it('should capture request params', async () => {
    req.params = { id: '123', name: 'test-collection' };

    auditLog(req, res, next);
    res.emit('finish');
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const logEntry = mockCollection.insertOne.mock.calls[0][0];
    expect(logEntry.params).toEqual({ id: '123', name: 'test-collection' });
  });
});

