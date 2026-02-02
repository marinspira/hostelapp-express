import { Request, Response, NextFunction } from 'express';
import { ValidateError } from 'tsoa';

import { HttpError } from '../utils/errors.js';

export interface ErrorResponse {
  success: false;
  message: string;
  details?: any;
}

export default function errorHandler(
  err: unknown,
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
): Response<ErrorResponse> | void {
  console.error('Error caught by middleware:', err);

  // Check if response is already sent
  if (res.headersSent) {
    return next(err);
  }

  // Handle TSOA validation errors
  if (err instanceof ValidateError) {
    console.warn(`Caught Validation Error for ${req.path}:`, err.fields);
    return res.status(422).json({
      success: false,
      message: 'Validation Failed',
      details: err.fields,
    });
  }

  // Handle custom HTTP errors
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  // Handle standard errors
  if (err instanceof Error) {
    // Log the error for debugging in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error stack:', err.stack);
    }

    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
    });
  }

  // Handle unknown errors
  console.error('Unknown error type:', err);
  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
  });
}
