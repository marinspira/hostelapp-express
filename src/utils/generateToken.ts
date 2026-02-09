import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { Types } from 'mongoose';

// Function to generate a JWT token only
export function generateToken(userId: Types.ObjectId): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: '15d', // Set the token's validity to 15 days
  });
}

// Function to generate a JWT token and set it in a cookie in the HTTP response
function generateTokenAndSetCookie(userId: Types.ObjectId, res: Response): string {
  // Generate a JWT token using the user's ID and a secret key
  const token = generateToken(userId);

  // Set a cookie named "jwt" in the HTTP response with the generated token
  res.cookie('jwt', token, {
    maxAge: 15 * 24 * 60 * 60 * 1000, // Set the cookie's validity to 15 days in milliseconds
    httpOnly: true, // The cookie can only be accessed by the server (not available to client-side JavaScript)
    sameSite: 'strict', // The cookie will only be sent for requests from the same site, enhancing security
  });

  return token;
}

// Export the function so it can be used in other parts of the application
export default generateTokenAndSetCookie;
