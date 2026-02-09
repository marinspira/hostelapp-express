import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import User from '../models/user.model';

interface AuthenticatedRequest extends Request {
  user?: any; // You might want to create a proper User interface
}

interface JwtPayload {
  userId: string;
}

// Middleware function to protect routes
const protectRoute = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get the token from request cookies
    const token = req.cookies.jwt || req.headers.authorization?.split(' ')[1];

    // If no token is provided, respond with a 401 status
    if (!token) {
      res.status(401).json({ error: 'Unauthorized - No Token Provided' });
      return;
    }

    // Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // If token verification fails, respond with a 401 status
    if (!decoded) {
      res.status(401).json({ error: 'Unauthorized - Invalid Token' });
      return;
    }

    // Find the user by the ID decoded from the token, excluding the password field
    const user = await User.findById(decoded.userId);

    // If the user is not found, respond with a 404 status
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if the token is still valid in the database (session management)
    if (!user.sessionToken || user.sessionToken !== token) {
      res.status(401).json({ error: 'Session expired or invalid' });
      return;
    }

    // Attach the user object to the request for use in the next middleware/route handler
    req.user = user;

    // Call the next middleware or route handler
    next();
  } catch (error: any) {
    console.error('Error in protectRoute middleware', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default protectRoute;
