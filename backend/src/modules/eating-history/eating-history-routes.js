// src/modules/eating-history/routes/eating-history.routes.js
import express from 'express';
import {createEatingHistoryEntry,getUserEatingHistory,updateEatingHistoryEntry,getUserAllEatingHistory,getUserEatingHistorySummary, deleteEatingHistory} from '../eating-history/eating-history-controllers.js';
import { protect } from '../auth/auth-middleware.js';

const router = express.Router(); // นี่คือ router ที่จะถูก export


router.post('/', protect, createEatingHistoryEntry);


router.get('/', protect, getUserEatingHistory);

router.get('/all', protect, getUserAllEatingHistory);

router.get('/summary', protect, getUserEatingHistorySummary);

router.patch('/',protect, updateEatingHistoryEntry)

router.delete('/:id',protect ,deleteEatingHistory)

export default router;