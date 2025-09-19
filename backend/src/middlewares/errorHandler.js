// src/middlewares/errorHandler.js

import AppError from '../utils/appError.js';

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
};

const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }

    console.error('ERROR 💥', err);

    res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!'
    });
};

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
    const value = err.keyValue ? Object.values(err.keyValue)[0] : 'duplicate value';
    const message = `Duplicate field value: "${value}". Please use another value!`;
    return new AppError(message, 409);
};

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401);

const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err };

        if (err.name === 'SequelizeUniqueConstraintError') {
            error = handleDuplicateFieldsDB(err);
        } else if (err.name === 'SequelizeValidationError') {
            error = handleValidationErrorDB(err);
        } else if (err.name === 'SequelizeForeignKeyConstraintError') {
            error = new AppError('Invalid foreign key reference!', 400);
        } else if (err.name === 'SequelizeDatabaseError' && err.parent && err.parent.code === 'ER_BAD_FIELD_ERROR') {
             error = new AppError('Invalid database field!', 400);
        } else if (err.name === 'JsonWebTokenError') {
            error = handleJWTError();
        } else if (err.name === 'TokenExpiredError') {
            error = handleJWTExpiredError();
        }
        sendErrorProd(error, res);
    }
};

export default globalErrorHandler;