import type { ErrorRequestHandler, RequestHandler } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/app-error.js';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl,
  });
};

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(422).json({
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      issues: error.issues,
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      message: error.message,
      code: error.code,
      details: error.details,
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    const isTooLarge = error.code === 'LIMIT_FILE_SIZE';

    res.status(isTooLarge ? 413 : 400).json({
      message: isTooLarge
        ? 'File is too large (images max 5 MB, videos max 50 MB)'
        : error.message,
      code: error.code,
    });
    return;
  }

  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({
      message: 'Invalid JSON body',
      code: 'INVALID_JSON',
    });
    return;
  }

  logger.error({ err: error, path: req.originalUrl, method: req.method }, 'Unhandled error');

  res.status(500).json({
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(env.NODE_ENV === 'development' && error instanceof Error
      ? { debug: error.message }
      : {}),
  });
};
