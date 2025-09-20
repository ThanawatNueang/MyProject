// config/database.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize(
    process.env.DB_DATABASE, // Changed from DB_NAME to DB_DATABASE as per your code
    process.env.DB_USERNAME,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT, // Added DB_PORT as per your code
        dialect: process.env.DB_DIALECT,
        logging: false,
        dialectOptions: {
            charset: 'utf8mb4',
            ssl: process.env.MYSQL_SSL === 'true'
            ? { require: true, rejectUnauthorized: true }
            : undefined,
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

export async function connectDB() {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error; // Re-throw the error to be handled by the caller (e.g., app.js)
    }
}
