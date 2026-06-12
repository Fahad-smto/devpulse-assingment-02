// src/modules/issues/issues.controller.ts
import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { issueServices } from './issues.service';
import { sendSuccess, sendError } from '../../utils/response';
import {
    isRequired,
    maxLength,
    minLength,
    isOneOf,
    collectErrors,
} from '../../utils/validate';

const createIssue = async (req: Request, res: Response) => {
    try {
        const { title, description, type } = req.body;

        const errors = collectErrors(
            isRequired(title,       'title'),
            isRequired(description, 'description'),
            isRequired(type,        'type'),
            title       ? maxLength(title,       150, 'title')                              : null,
            description ? minLength(description, 20,  'description')                       : null,
            type        ? isOneOf(type, ['bug', 'feature_request'], 'type')                 : null
        );

        if (errors.length > 0) {
            return sendError(res, StatusCodes.BAD_REQUEST, 'Validation failed', errors);
        }

        // reporter_id comes from the decoded JWT — not from the request body
        const reporter_id = req.user!.id;

        const issue = await issueServices.createIssueInDB({ title, description, type, reporter_id });
        return sendSuccess(res, StatusCodes.CREATED, 'Issue created successfully', issue);

    } catch (error: unknown) {
        return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Something went wrong.');
    }
};

const getAllIssues = async (req: Request, res: Response) => {
    try {
        const { sort, type, status } = req.query;

        if (sort   && !['newest', 'oldest'].includes(sort as string)) {
            return sendError(res, StatusCodes.BAD_REQUEST, 'sort must be "newest" or "oldest"');
        }
        if (type   && !['bug', 'feature_request'].includes(type as string)) {
            return sendError(res, StatusCodes.BAD_REQUEST, 'type must be "bug" or "feature_request"');
        }
        if (status && !['open', 'in_progress', 'resolved'].includes(status as string)) {
            return sendError(res, StatusCodes.BAD_REQUEST, 'status must be "open", "in_progress", or "resolved"');
        }

        const issues = await issueServices.getAllIssuesFromDB({
            sort:   sort   as string,
            type:   type   as string,
            status: status as string,
        });

        return sendSuccess(res, StatusCodes.OK, 'Issues retrived successfully', issues);

    } catch (error: unknown) {
        return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Something went wrong.');
    }
};

const getSingleIssue = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id, 10);

        if (isNaN(id)) {
            return sendError(res, StatusCodes.BAD_REQUEST, 'Issue ID must be a number.');
        }

        const issue = await issueServices.getIssueByIdFromDB(id);

        if (!issue) {
            return sendError(res, StatusCodes.NOT_FOUND, 'Issue not found.');
        }

        return sendSuccess(res, StatusCodes.OK, 'Issue retrived successfully', issue);

    } catch (error: unknown) {
        return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Something went wrong.');
    }
};

const updateIssue = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id, 10);

        if (isNaN(id)) {
            return sendError(res, StatusCodes.BAD_REQUEST, 'Issue ID must be a number.');
        }

        const existingIssue = await issueServices.getRawIssueById(id);

        if (!existingIssue) {
            return sendError(res, StatusCodes.NOT_FOUND, 'Issue not found.');
        }

        const currentUser = req.user!;

        // Permission check:
        // - Contributors can only edit their OWN issues AND only when status is "open"
        // - Maintainers can edit ANY issue regardless of status
        if (currentUser.role === 'contributor') {
            if (existingIssue.reporter_id !== currentUser.id) {
                return sendError(res, StatusCodes.FORBIDDEN, 'You can only update your own issues.');
            }
            if (existingIssue.status !== 'open') {
                return sendError(res, StatusCodes.CONFLICT, 'You can only update issues with status "open".');
            }
        }

        const { title, description, type, status } = req.body;

        // Contributors cannot change status
        if (status && currentUser.role !== 'maintainer') {
            return sendError(res, StatusCodes.FORBIDDEN, 'Only maintainers can change the status.');
        }

        const errors = collectErrors(
            title       ? maxLength(title,       150, 'title')                              : null,
            description ? minLength(description, 20,  'description')                       : null,
            type        ? isOneOf(type,   ['bug', 'feature_request'],          'type')      : null,
            status      ? isOneOf(status, ['open', 'in_progress', 'resolved'], 'status')   : null
        );

        if (errors.length > 0) {
            return sendError(res, StatusCodes.BAD_REQUEST, 'Validation failed', errors);
        }

        const updateData: { title?: string; description?: string; type?: string; status?: string } = {};
        if (title)       updateData.title       = title;
        if (description) updateData.description = description;
        if (type)        updateData.type        = type;
        if (status)      updateData.status      = status;

        const updatedIssue = await issueServices.updateIssueInDB(id, updateData);
        return sendSuccess(res, StatusCodes.OK, 'Issue updated successfully', updatedIssue);

    } catch (error: unknown) {
        return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Something went wrong.');
    }
};

const deleteIssue = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id, 10);

        if (isNaN(id)) {
            return sendError(res, StatusCodes.BAD_REQUEST, 'Issue ID must be a number.');
        }

        const deleted = await issueServices.deleteIssueFromDB(id);

        if (!deleted) {
            return sendError(res, StatusCodes.NOT_FOUND, 'Issue not found.');
        }

        return sendSuccess(res, StatusCodes.OK, 'Issue deleted successfully', undefined);

    } catch (error: unknown) {
        return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Something went wrong.');
    }
};

export const issueController = {
    createIssue,
    getAllIssues,
    getSingleIssue,
    updateIssue,
    deleteIssue,
};
