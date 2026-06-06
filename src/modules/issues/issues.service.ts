// src/modules/issues/issues.service.ts
import { pool } from '../../config/db';
import type {
    ICreateIssue,
    IUpdateIssue,
    IIssueRow,
    IIssueWithReporter,
    IIssueFilters,
    IReporter,
} from './issues.interface';

// ─── Private helper ───────────────────────────────────────────────────────────
// Fetches reporter info for a list of issues WITHOUT using SQL JOINs.
// Steps:
//   1. Collect all unique reporter IDs from the issues array
//   2. Fetch all matching users in ONE query using WHERE id = ANY($1)
//   3. Build a lookup map { userId: reporterObject }
//   4. Merge each issue with its reporter

const attachReporters = async (issues: IIssueRow[]): Promise<IIssueWithReporter[]> => {
    if (issues.length === 0) return [];

    const reporterIds = [...new Set(issues.map((i) => i.reporter_id))];

    const reportersResult = await pool.query(
        'SELECT id, name, role FROM users WHERE id = ANY($1)',
        [reporterIds]
    );

    // Build a lookup map so we can find a reporter by ID in O(1) time
    const reporterMap: Record<number, IReporter> = {};
    for (const row of reportersResult.rows) {
        reporterMap[row.id] = row as IReporter;
    }

    return issues.map((issue) => ({
        id:          issue.id,
        title:       issue.title,
        description: issue.description,
        type:        issue.type,
        status:      issue.status,
        reporter:    reporterMap[issue.reporter_id] ?? { id: issue.reporter_id, name: 'Unknown', role: 'contributor' },
        created_at:  issue.created_at,
        updated_at:  issue.updated_at,
    }));
};

// ─── Service functions ────────────────────────────────────────────────────────

const createIssueInDB = async (input: ICreateIssue): Promise<IIssueRow> => {
    const { title, description, type, reporter_id } = input;

    const result = await pool.query(
        `INSERT INTO issues (title, description, type, reporter_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [title, description, type, reporter_id]
    );

    return result.rows[0] as IIssueRow;
};

const getAllIssuesFromDB = async (filters: IIssueFilters): Promise<IIssueWithReporter[]> => {
    let query = 'SELECT * FROM issues';
    const params: string[] = [];
    const conditions: string[] = [];

    if (filters.type) {
        params.push(filters.type);
        conditions.push(`type = $${params.length}`);
    }

    if (filters.status) {
        params.push(filters.status);
        conditions.push(`status = $${params.length}`);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    const sortOrder = filters.sort === 'oldest' ? 'ASC' : 'DESC';
    query += ` ORDER BY created_at ${sortOrder}`;

    const result = await pool.query(query, params);
    return attachReporters(result.rows as IIssueRow[]);
};

const getIssueByIdFromDB = async (id: number): Promise<IIssueWithReporter | null> => {
    const result = await pool.query('SELECT * FROM issues WHERE id = $1', [id]);

    if (result.rows.length === 0) return null;

    const issues = await attachReporters(result.rows as IIssueRow[]);
    return issues[0];
};

// Returns raw row (reporter_id as number) — used for permission checks inside the controller
const getRawIssueById = async (id: number): Promise<IIssueRow | null> => {
    const result = await pool.query('SELECT * FROM issues WHERE id = $1', [id]);
    return result.rows.length > 0 ? (result.rows[0] as IIssueRow) : null;
};

const updateIssueInDB = async (id: number, input: IUpdateIssue): Promise<IIssueRow> => {
    // Build the SET clause dynamically — only update fields that were actually sent
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (input.title !== undefined) {
        fields.push(`title = $${paramIndex++}`);
        values.push(input.title);
    }
    if (input.description !== undefined) {
        fields.push(`description = $${paramIndex++}`);
        values.push(input.description);
    }
    if (input.type !== undefined) {
        fields.push(`type = $${paramIndex++}`);
        values.push(input.type);
    }
    if (input.status !== undefined) {
        fields.push(`status = $${paramIndex++}`);
        values.push(input.status);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
        UPDATE issues
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] as IIssueRow;
};

const deleteIssueFromDB = async (id: number): Promise<boolean> => {
    const result = await pool.query('DELETE FROM issues WHERE id = $1 RETURNING id', [id]);
    return result.rows.length > 0;
};

export const issueServices = {
    createIssueInDB,
    getAllIssuesFromDB,
    getIssueByIdFromDB,
    getRawIssueById,
    updateIssueInDB,
    deleteIssueFromDB,
};
