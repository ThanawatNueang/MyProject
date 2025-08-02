// src/modules/eating-history/routes/eating-history.routes.js
import express from 'express';
import {createEatingHistoryEntry,getUserEatingHistory,getUserEatingHistorySummary} from '../eating-history/eating-history-controllers.js';
import { protect } from '../auth/auth-middleware.js';

const router = express.Router(); // นี่คือ router ที่จะถูก export

// Route 1: POST /
router.post('/', protect, createEatingHistoryEntry);

// Route 2: GET /
router.get('/', protect, getUserEatingHistory);

// Route 3: GET /summary
router.get('/summary', protect, getUserEatingHistorySummary);

export default router;