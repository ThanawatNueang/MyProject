import app from './src/app.js'
import dotenv from 'dotenv';
import { connectDB } from './src/config/db.js';


dotenv.config();

process.on('uncaughtException', err => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err.name, err.message, err.stack);
    process.exit(1);
});

const startServer = async () => {
    try{
        await connectDB();
        const port = process.env.PORT || 3000;
        const server = app.listen(port, () => {
            console.log(`App running on port ${port} in ${process.env.NODE_ENV} mode...`);
        });

        process.on('unhandledRejection', err => {
            console.error('UNHANDLED REJECTION! Shutting down...');
            console.error(err.name, err.message, err.stack);
            server.close(() => {
                process.exit(1);
            });
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();