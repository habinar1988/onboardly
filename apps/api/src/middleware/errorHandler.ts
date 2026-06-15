import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  const status = (err as { status?: number }).status ?? 500;
  res.status(status).json({
    error: err.name || 'internal_error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
  });
}

export class AppError extends Error {
  constructor(public status: number, public error: string, message: string) {
    super(message);
    this.name = error;
  }
}
