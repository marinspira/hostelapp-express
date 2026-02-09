import { Request, Response, NextFunction } from 'express';
import { ValidateError } from 'tsoa';

interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
  details?: any;
}

const errorHandler = async (
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const errorDetails = {
    message: err.message,
    stack: err.stack,
    route: req.originalUrl,
    type: req.method,
    time: new Date(),
  };

  console.log('Error details from middleware:', JSON.stringify(errorDetails, null, 2));

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

  // Handle custom HTTP errors with statusCode property
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  // Default error handling
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({ success: false, message });
};

export default errorHandler;
