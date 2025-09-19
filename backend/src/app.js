import express from 'express';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import xss from 'xss-clean';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';

import AppError from './utils/appError.js';
import globalErrorHandler from './middlewares/errorHandler.js';

import userRoutes from './modules/user/user-route.js';
import authRoute from './modules/auth/auth-route.js'
import foodRoute from './modules/food/routes/food-route.js'
import ingredientRoute from './modules/food/routes/ingredient-route.js'
import eatinghistoryroute from './modules/eating-history/eating-history-routes.js'
// import authRouter from './modules/auth/auth-route.js';

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://100.88.251.63:5173',
  'http://localhost:5174',
  'http://localhost:5175',
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error('CORS blocked: Origin not allowed ->', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT','PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); 
}

// const limiter = rateLimit({
//     max: 100,
//     windowMs: 60 * 60 * 1000,
//     message: 'Too many requests from this IP, please try again in an hour!'
// });

// app.use('/api', limiter); // ใช้ limiter กับทุก Request ที่ขึ้นต้นด้วย /api

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());

app.use(xss());

app.use(hpp({
    whitelist: [
    ]
}));

app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// Test middleware (ถ้าต้องการ)
// app.use((req, res, next) => {
//     req.requestTime = new Date().toISOString();
//     next();
// });

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to the API! Server is running and all basic middlewares are active.' });
});

app.use('/api', userRoutes);
app.use('/api/auth', authRoute);
app.use('/api/ingredients', ingredientRoute);
app.use('/api/foods', foodRoute);
app.use('/api/eatinghistory', eatinghistoryroute);

app.all('/*', (req, res) => {
    res.status(404).json({
        status: 'fail',
        message: `Can't find ${req.originalUrl} on this server!`
    });
});

app.use(globalErrorHandler);

export default app;