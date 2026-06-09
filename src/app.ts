// src/app.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './modules/auth/auth.routes';
import issuesRoutes from './modules/issues/issues.routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();

// ──   middleware 
app.use(cors());
app.use(express.json());

// ── Routes 
app.get('/', (req, res) => {
    res.json({ success: true, message: 'DevPulse API is running 🚀' });
});

app.use('/api/auth',   authRoutes);
app.use('/api/issues', issuesRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`,
    });
});

// ── Global error handler  ───────────────────────────────────────
app.use(errorHandler);

export default app;
