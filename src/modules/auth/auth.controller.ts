// src/modules/auth/auth.controller.ts
import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { authServices } from './auth.service';
import { sendSuccess, sendError } from '../../utils/response';
import { isRequired, isValidEmail, isOneOf, minLength, collectErrors } from '../../utils/validate';

const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role } = req.body;

        const errors = collectErrors(
            isRequired(name, 'name'),
            isRequired(email, 'email'),
            isRequired(password, 'password'),
            isRequired(role, 'role'),
            email     ? isValidEmail(email)                                   : null,
            password  ? minLength(password, 6, 'password')                   : null,
            role      ? isOneOf(role, ['contributor', 'maintainer'], 'role')  : null
        );

        if (errors.length > 0) {
            return sendError(res, StatusCodes.BAD_REQUEST, 'Validation failed', errors);
        }

        const user = await authServices.registerUser({ name, email, password, role });
        return sendSuccess(res, StatusCodes.CREATED, 'User registered successfully', user);

    } catch (error: unknown) {
        if (error instanceof Error && error.message === 'EMAIL_TAKEN') {
            return sendError(res, StatusCodes.BAD_REQUEST, 'This email is already registered.');
        }
        return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Something went wrong.');
    }
};

const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const errors = collectErrors(
            isRequired(email, 'email'),
            isRequired(password, 'password'),
            email ? isValidEmail(email) : null
        );

        if (errors.length > 0) {
            return sendError(res, StatusCodes.BAD_REQUEST, 'Validation failed', errors);
        }

        const result = await authServices.loginUser({ email, password });
        return sendSuccess(res, StatusCodes.OK, 'Login successful', result);

    } catch (error: unknown) {
        if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
            return sendError(res, StatusCodes.UNAUTHORIZED, 'Invalid email or password.');
        }
        return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Something went wrong.');
    }
};

export const authController = {
    register,
    login,
};
