// src/server.ts
import app from './app';
// import { pool, initDatabase } from './config/db';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
       
        await initDatabase();
        console.log('✅ Database tables ready');
        
        
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();