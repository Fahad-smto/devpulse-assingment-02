// src/middleware/authenticate.ts
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { sendError } from '../utils/response';

// Extend Express Request so TypeScript knows about req.user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                name: string;
                role: string;
            };
        }
    }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.headers.authorization;

    if (!token) {
        sendError(res, StatusCodes.UNAUTHORIZED, 'Access denied. No token provided.');
        return;
    }

    try {
        const secret = process.env.JWT_SECRET as string;
        const decoded = jwt.verify(token, secret) as { id: number; name: string; role: string };
        req.user = decoded;
        next();
    } catch (error: unknown) {
        sendError(res, StatusCodes.UNAUTHORIZED, 'Invalid or expired token.');
    }
};
