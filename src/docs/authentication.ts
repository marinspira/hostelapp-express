import jwt from 'jsonwebtoken';
import type { Request } from 'express';

import User from '../models/user.model';

interface JWTPayload {
  userId: string;
  [key: string]: any;
}

export async function expressAuthentication(
  request: Request,
  securityName: string,
  scopes?: string[]
): Promise<any> {
  if (securityName === 'jwt') {
    // Get the token from request cookies OR authorization header (same as protectRoute.js)
    const token = request.cookies?.jwt || request.headers.authorization?.split(' ')[1];

    // If no token is provided, throw 401 error (same as protectRoute.js)
    if (!token) {
      const error = new Error('User not authenticated');
      (error as any).status = 401;
      throw error;
    }

    try {
      // Verify the token using the secret key (same as protectRoute.js)
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        const error = new Error('JWT secret not configured');
        (error as any).status = 500;
        throw error;
      }

      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

      // If token verification fails, throw 401 error (same as protectRoute.js)
      if (!decoded) {
        const error = new Error('Unauthorized - Invalid Token');
        (error as any).status = 401;
        throw error;
      }

      // Find the user by the ID decoded from the token (same as protectRoute.js)
      const user = await User.findById(decoded.userId);

      // If the user is not found, throw 404 error (same as protectRoute.js)
      if (!user) {
        const error = new Error('User not found');
        (error as any).status = 404;
        throw error;
      }

      // Check if the token is still valid in the database (session management)
      if (!user.sessionToken || user.sessionToken !== token) {
        const error = new Error('Session expired or invalid');
        (error as any).status = 401;
        throw error;
      }

      // Role/scope verification - TSOA passes required roles in the scopes array
      if (scopes && scopes.length > 0) {
        const userRole = user.role; // Adjust based on your user model

        // Check if user has one of the required roles
        const hasRequiredRole = scopes.includes(userRole);

        if (!hasRequiredRole) {
          const error = new Error(`Insufficient permissions. Required roles: ${scopes.join(', ')}`);
          (error as any).status = 403; // Forbidden
          throw error;
        }
      }

      // Attach the user object to the request (same as protectRoute.js)
      (request as any).user = user;

      // Return the user object
      return user;
    } catch (err: any) {
      // Handle JWT verification errors
      if (err.name === 'JsonWebTokenError') {
        const error = new Error('Unauthorized - Invalid Token');
        (error as any).status = 401;
        throw error;
      }
      if (err.name === 'TokenExpiredError') {
        const error = new Error('Unauthorized - Token Expired');
        (error as any).status = 401;
        throw error;
      }
      // If it's already one of our custom errors, re-throw it
      if (err.status) {
        throw err;
      }
      // For other errors, throw 500 (same as protectRoute.js)
      const error = new Error('Internal server error');
      (error as any).status = 500;
      throw error;
    }
  }

  const error = new Error(`Unknown authentication method: ${securityName}`);
  (error as any).status = 401;
  throw error;
}
