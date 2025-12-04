export const authenticate = jest.fn((req, res, next) => next());
export const generateToken = jest.fn((payload, expiresIn) => 'mock-token');

