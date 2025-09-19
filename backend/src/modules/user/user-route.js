// src/routes/userRoutes.js
import express from 'express';
import { getAllUsers,getMe, updateMe,getUserNutritionGoals } from '../user/user-controller.js';
import { protect } from '../auth/auth-middleware.js';
import upload from '../../config/multerConfig.js';


const router = express.Router();

router.get('/users', getAllUsers);

router.get('/getme',protect, getMe);

router.patch('/updateme', protect, upload.single('profilePicture'), updateMe);

router.get('/me/nutrition-goals', protect, getUserNutritionGoals);

export default router;