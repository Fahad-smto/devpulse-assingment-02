// src/middleware/errorHandler.ts
import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { sendError } from '../utils/response';

// 4-parameter signature is required for Express to recognise this as an error handler
export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    console.error('🔥 Unhandled error:', err.message);

    sendError(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Something went wrong on the server.',
        process.env.NODE_ENV === 'development' ? err.message : undefined
    );
};
