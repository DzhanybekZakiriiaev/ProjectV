import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { authenticate, generateToken } from '../auth.js';

describe('Auth Middleware', () => {
  const mockSecret = process.env.JWT_SECRET || 'change-this-secret-in-production';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = { username: 'testuser', email: 'test@example.com' };
      const token = generateToken(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Verify token can be decoded with the actual secret
      const decoded = jwt.verify(token, mockSecret);
      expect(decoded.username).toBe(payload.username);
      expect(decoded.email).toBe(payload.email);
    });

    it('should generate token with custom expiration', () => {
      const payload = { username: 'testuser' };
      const token = generateToken(payload, '1h');
      
      const decoded = jwt.verify(token, mockSecret);
      expect(decoded).toHaveProperty('exp');
      expect(decoded.username).toBe(payload.username);
    });

    it('should use default expiration when not provided', () => {
      const payload = { username: 'testuser' };
      const token = generateToken(payload);
      
      const decoded = jwt.verify(token, mockSecret);
      expect(decoded).toHaveProperty('exp');
    });
  });

  describe('authenticate', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        headers: {},
        user: null
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      next = jest.fn();
    });

    it('should return 401 when authorization header is missing', () => {
      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized: missing or invalid token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header does not start with Bearer', () => {
      req.headers.authorization = 'Invalid token';

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized: missing or invalid token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', () => {
      req.headers.authorization = 'Bearer invalid-token';

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized: invalid token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next and set req.user when token is valid', () => {
      const payload = { username: 'testuser', email: 'test@example.com' };
      const token = generateToken(payload);
      req.headers.authorization = `Bearer ${token}`;

      authenticate(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.username).toBe(payload.username);
      expect(req.user.email).toBe(payload.email);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle expired token', () => {
      const payload = { username: 'testuser' };
      const token = jwt.sign(payload, mockSecret, { expiresIn: '-1h' });
      req.headers.authorization = `Bearer ${token}`;

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized: invalid token'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});

