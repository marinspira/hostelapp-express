export class HttpError extends Error {
  constructor(public statusCode: number, message: string, public details?: any) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string, details?: any) {
    super(400, message, details);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string = "Unauthorized") {
    super(401, message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string = "Forbidden") {
    super(403, message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string = "Resource not found") {
    super(404, message);
  }
}

export class ConflictError extends HttpError {
  constructor(message: string, details?: any) {
    super(409, message, details);
  }
}

export class ValidationError extends HttpError {
  constructor(message: string, details?: any) {
    super(422, message, details);
  }
}

export class InternalServerError extends HttpError {
  constructor(message: string = "Internal server error") {
    super(500, message);
  }
}
