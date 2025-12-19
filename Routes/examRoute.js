import express from 'express';
import {
    createExam,
    getAllExams,
    getExamById,
    updateExam,
    deleteExam,
    addQuestionsToExam,
    removeQuestionFromExam,
    getAvailableExams,
    enrollInExam,
    getEnrolledExams,
    startExam,
    saveAnswer,
    submitExam,
    getExamStats
} from '../Controllers/examController.js';
import { authenticate, isAdmin, isStudent } from '../Middleware/Middleware.js';

const router = express.Router();

router.get('/available', authenticate, getAvailableExams);
router.get('/enrolled', authenticate, getEnrolledExams);
router.get('/stats', authenticate, isAdmin, getExamStats);

router.post('/', authenticate, isAdmin, createExam);
router.get('/', authenticate, isAdmin, getAllExams);
router.get('/:examId', authenticate, getExamById);
router.put('/:examId', authenticate, isAdmin, updateExam);
router.delete('/:examId', authenticate, isAdmin, deleteExam);

router.post('/:examId/questions', authenticate, isAdmin, addQuestionsToExam);
router.delete('/:examId/questions/:questionId', authenticate, isAdmin, removeQuestionFromExam);

router.post('/:examId/enroll', authenticate, enrollInExam);
router.post('/:examId/start', authenticate, startExam);
router.post('/answer/:resultId', authenticate, saveAnswer);
router.post('/submit/:resultId', authenticate, submitExam);

export default router;

