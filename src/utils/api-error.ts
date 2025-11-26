export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errors: any[];

  constructor(
    statusCode: number,
    message: string,
    errors: any[] = [],
    isOperational = true
  ) {
    super(message);

    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;

    // Ensures stack trace is captured correctly
    Error.captureStackTrace(this, this.constructor);
  }
}
