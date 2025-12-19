import express from 'express';
import {
    logProctoringEvent,
    getProctoringLogs,
    getStudentProctoringLogs,
    reviewProctoringLog,
    getFlaggedExams,
    getProctoringStats,
    terminateExam,
    getActiveSessions
} from '../Controllers/proctoringController.js';
import { authenticate, isAdmin, isProctor, authorizeRoles } from '../Middleware/Middleware.js';

const router = express.Router();

router.post('/log', authenticate, logProctoringEvent);

router.get('/logs', authenticate, authorizeRoles('admin', 'proctor'), getProctoringLogs);
router.get('/logs/:studentId/:examId', authenticate, authorizeRoles('admin', 'proctor'), getStudentProctoringLogs);
router.put('/logs/:logId/review', authenticate, authorizeRoles('admin', 'proctor'), reviewProctoringLog);

router.get('/flagged', authenticate, authorizeRoles('admin', 'proctor'), getFlaggedExams);
router.get('/stats', authenticate, authorizeRoles('admin', 'proctor'), getProctoringStats);
router.get('/active-sessions', authenticate, authorizeRoles('admin', 'proctor'), getActiveSessions);

router.post('/terminate/:resultId', authenticate, authorizeRoles('admin', 'proctor'), terminateExam);

export default router;

