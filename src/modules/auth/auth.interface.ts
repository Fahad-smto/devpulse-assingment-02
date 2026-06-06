// src/modules/auth/auth.interface.ts

export interface IRegisterInput {
    name: string;
    email: string;
    password: string;
    role: string;
}

export interface ILoginInput {
    email: string;
    password: string;
}

// Shape of a user row returned from the database (password excluded)
export interface IUser {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
    updated_at: string;
}

// Raw DB row that includes the hashed password (used only inside the service)
export interface IUserRow extends IUser {
    password: string;
}

// What the login service returns to the controller
export interface ILoginResult {
    token: string;
    user: IUser;
}
