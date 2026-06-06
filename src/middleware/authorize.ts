// src/middleware/authorize.ts
import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { sendError } from '../utils/response';

// Returns a middleware that only allows the given role
// Usage: router.delete('/:id', authenticate, authorize('maintainer'), handler)
export const authorize = (requiredRole: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            sendError(res, StatusCodes.UNAUTHORIZED, 'Not authenticated.');
            return;
        }

        if (req.user.role !== requiredRole) {
            sendError(res, StatusCodes.FORBIDDEN, `Access denied. Only ${requiredRole}s can perform this action.`);
            return;
        }

        next();
    };
};
