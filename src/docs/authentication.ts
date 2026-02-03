import jwt from 'jsonwebtoken';
import type { Request } from 'express';

export async function expressAuthentication(
  request: Request,
  securityName: string,
  scopes?: string[]
): Promise<any> {
  if (securityName === 'jwt') {
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('No authorization token provided');
      (error as any).status = 401;
      throw error;
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const secret = process.env.JWT_SECRET || 'your_jwt_secret';
      const user = jwt.verify(token, secret);
      
      // Optionally check scopes/roles here
      if (scopes && scopes.length > 0) {
        // Implement scope checking logic here if needed
        // For now, we'll just return the user
      }
      
      return user;
    } catch (err) {
      const error = new Error('Invalid token');
      (error as any).status = 401;
      throw error;
    }
  }
  
  const error = new Error(`Unknown authentication method: ${securityName}`);
  (error as any).status = 401;
  throw error;
}