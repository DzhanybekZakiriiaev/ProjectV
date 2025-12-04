import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import authRouter from '../authRoutes.js';
import { getDb } from '../../config/db.js';
import { generateToken } from '../../middleware/auth.js';

jest.mock('../../config/db.js');
jest.mock('../../middleware/auth.js');

describe('Auth Routes', () => {
  let app;
  let mockCollection;
  let mockDb;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCollection = {
      findOne: jest.fn()
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection)
    };

    getDb.mockResolvedValue(mockDb);

    app = express();
    app.use(express.json());
    app.use('/auth', authRouter);
  });

  describe('POST /auth/login', () => {
    it('should return 400 when username is missing', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'username and password required' });
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ username: 'testuser' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'username and password required' });
    });

    it('should return 400 when body is empty', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'username and password required' });
    });

    it('should return 401 when user is not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/login')
        .send({ username: 'nonexistent', password: 'password123' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Invalid credentials' });
      expect(mockDb.collection).toHaveBeenCalledWith('users');
      expect(mockCollection.findOne).toHaveBeenCalledWith({ username: 'nonexistent' });
    });

    it('should return 401 when password is incorrect', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      mockCollection.findOne.mockResolvedValue({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword
      });

      const response = await request(app)
        .post('/auth/login')
        .send({ username: 'testuser', password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Invalid credentials' });
    });

    it('should return token and user info on successful login', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword
      };

      mockCollection.findOne.mockResolvedValue(mockUser);
      generateToken.mockReturnValue('mock-jwt-token');

      const response = await request(app)
        .post('/auth/login')
        .send({ username: 'testuser', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        token: 'mock-jwt-token',
        user: {
          username: 'testuser',
          email: 'test@example.com'
        }
      });
      expect(generateToken).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com'
      });
    });

    it('should handle database errors', async () => {
      mockCollection.findOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/auth/login')
        .send({ username: 'testuser', password: 'password123' });

      expect(response.status).toBe(500);
    });
  });
});

