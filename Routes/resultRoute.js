import express from 'express';
import {
    getStudentResults,
    getResultById,
    getExamResults,
    getExamAnalytics,
    getStudentAnalytics,
    addFeedback,
    getDashboardStats
} from '../Controllers/resultController.js';
import { authenticate, isAdmin, authorizeRoles } from '../Middleware/Middleware.js';

const router = express.Router();

router.get('/my-results', authenticate, getStudentResults);
router.get('/my-analytics', authenticate, getStudentAnalytics);
router.get('/dashboard', authenticate, isAdmin, getDashboardStats);

router.get('/exam/:examId', authenticate, isAdmin, getExamResults);
router.get('/exam/:examId/analytics', authenticate, isAdmin, getExamAnalytics);
router.get('/student/:studentId/analytics', authenticate, authorizeRoles('admin', 'proctor'), getStudentAnalytics);

router.get('/:resultId', authenticate, getResultById);
router.put('/:resultId/feedback', authenticate, isAdmin, addFeedback);

export default router;

