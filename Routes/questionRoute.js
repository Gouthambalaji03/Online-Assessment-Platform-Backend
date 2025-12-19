import express from 'express';
import {
    createQuestion,
    createBulkQuestions,
    getAllQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
    getCategories,
    getTopics,
    getQuestionStats
} from '../Controllers/questionController.js';
import { authenticate, isAdmin } from '../Middleware/Middleware.js';

const router = express.Router();

router.get('/categories', authenticate, getCategories);
router.get('/topics', authenticate, getTopics);
router.get('/stats', authenticate, isAdmin, getQuestionStats);

router.post('/', authenticate, isAdmin, createQuestion);
router.post('/bulk', authenticate, isAdmin, createBulkQuestions);
router.get('/', authenticate, isAdmin, getAllQuestions);
router.get('/:questionId', authenticate, isAdmin, getQuestionById);
router.put('/:questionId', authenticate, isAdmin, updateQuestion);
router.delete('/:questionId', authenticate, isAdmin, deleteQuestion);

export default router;

