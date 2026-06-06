// src/modules/auth/auth.service.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../../config/db';
import type { IRegisterInput, ILoginInput, IUser, IUserRow, ILoginResult } from './auth.interface';

const registerUser = async (input: IRegisterInput): Promise<IUser> => {
    const { name, email, password, role } = input;

    // Check if email is already taken
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
        throw new Error('EMAIL_TAKEN');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
        `INSERT INTO users (name, email, password, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, role, created_at, updated_at`,
        [name, email, hashedPassword, role]
    );

    return result.rows[0] as IUser;
};

const loginUser = async (input: ILoginInput): Promise<ILoginResult> => {
    const { email, password } = input;

    // Fetch user including the stored password hash
    const result = await pool.query(
        'SELECT id, name, email, password, role, created_at, updated_at FROM users WHERE email = $1',
        [email]
    );

    if (result.rows.length === 0) {
        throw new Error('INVALID_CREDENTIALS');
    }

    const userRow = result.rows[0] as IUserRow;

    const passwordMatch = await bcrypt.compare(password, userRow.password);
    if (!passwordMatch) {
        throw new Error('INVALID_CREDENTIALS');
    }

    const secret = process.env.JWT_SECRET as string;
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    const token = jwt.sign(
        { id: userRow.id, name: userRow.name, role: userRow.role },
        secret,
        { expiresIn } as jwt.SignOptions
    );

    // Return user without the password field
    const user: IUser = {
        id: userRow.id,
        name: userRow.name,
        email: userRow.email,
        role: userRow.role,
        created_at: userRow.created_at,
        updated_at: userRow.updated_at,
    };

    return { token, user };
};

export const authServices = {
    registerUser,
    loginUser,
};
