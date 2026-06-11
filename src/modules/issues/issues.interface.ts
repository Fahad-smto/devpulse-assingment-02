// src/modules/issues/issues.interface.ts

// export interface ICreateIssue {
//     title: string;
//     description: string;
//     type: string;
//     reporter_id: number;
// }

export interface IUpdateIssue {
    title?: string;
    description?: string;
    type?: string;
    status?: string;
}

// Raw issue row from the database (reporter_id is just a number)
export interface IIssueRow {
    id: number;
    title: string;
    description: string;
    type: string;
    status: string;
    reporter_id: number;
    created_at: string;
    updated_at: string;
}

// Reporter info embedded inside an issue (no JOIN — fetched separately)
export interface IReporter {
    id: number;
    name: string;
    role: string;
}

// Issue with the full reporter object nested inside (returned to clients)
export interface IIssueWithReporter {
    id: number;
    title: string;
    description: string;
    type: string;
    status: string;
    reporter: IReporter;
    created_at: string;
    updated_at: string;
}

// Query filter options for GET /api/issues
export interface IIssueFilters {
    sort?: string;
    type?: string;
    status?: string;
}
