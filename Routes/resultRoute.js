import express from 'express';
import {
    getStudentResults,
    getResultById,
    getExamResults,
    getExamAnalytics,
    getStudentAnalytics,
    addFeedback,
    getDashboardStats,
    getPendingGrading,
    gradeShortAnswer,
    bulkGradeResult,
    exportExamResultsCSV,
    exportStudentResultsCSV,
    getStudentPerformanceTrends
} from '../Controllers/resultController.js';
import { authenticate, isAdmin, authorizeRoles } from '../Middleware/Middleware.js';

const router = express.Router();

router.get('/my-results', authenticate, getStudentResults);
router.get('/my-analytics', authenticate, getStudentAnalytics);
router.get('/my-trends', authenticate, getStudentPerformanceTrends);
router.get('/my-export', authenticate, exportStudentResultsCSV);
router.get('/dashboard', authenticate, isAdmin, getDashboardStats);
router.get('/pending-grading', authenticate, isAdmin, getPendingGrading);

router.get('/exam/:examId', authenticate, isAdmin, getExamResults);
router.get('/exam/:examId/analytics', authenticate, isAdmin, getExamAnalytics);
router.get('/exam/:examId/export', authenticate, isAdmin, exportExamResultsCSV);
router.get('/student/:studentId/analytics', authenticate, authorizeRoles('admin', 'proctor'), getStudentAnalytics);
router.get('/student/:studentId/trends', authenticate, authorizeRoles('admin', 'proctor'), getStudentPerformanceTrends);
router.get('/student/:studentId/export', authenticate, isAdmin, exportStudentResultsCSV);

router.get('/:resultId', authenticate, getResultById);
router.put('/:resultId/feedback', authenticate, isAdmin, addFeedback);
router.put('/:resultId/grade/:answerId', authenticate, isAdmin, gradeShortAnswer);
router.put('/:resultId/bulk-grade', authenticate, isAdmin, bulkGradeResult);

export default router;

