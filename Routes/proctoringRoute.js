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
import { authenticate, authorizeRoles } from '../Middleware/Middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/proctoring/log:
 *   post:
 *     summary: Log a proctoring event
 *     tags: [Proctoring]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - examId
 *               - resultId
 *               - eventType
 *             properties:
 *               examId:
 *                 type: string
 *                 description: Exam ID
 *               resultId:
 *                 type: string
 *                 description: Result ID
 *               eventType:
 *                 type: string
 *                 enum: [tab_switch, window_blur, copy_paste, right_click, fullscreen_exit, face_not_detected, multiple_faces, suspicious_movement, browser_resize, devtools_open, screenshot_attempt, identity_mismatch, network_disconnect, exam_started, exam_submitted, exam_terminated]
 *                 example: tab_switch
 *               description:
 *                 type: string
 *                 example: "User switched to another tab"
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 default: low
 *               screenshot:
 *                 type: string
 *                 description: Base64 encoded screenshot or URL
 *               metadata:
 *                 type: object
 *                 description: Additional event data
 *     responses:
 *       201:
 *         description: Proctoring event logged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 log:
 *                   $ref: '#/components/schemas/ProctoringLog'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/log', authenticate, logProctoringEvent);

/**
 * @swagger
 * /api/proctoring/logs:
 *   get:
 *     summary: Get all proctoring logs (Admin/Proctor only)
 *     tags: [Proctoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of logs per page
 *       - in: query
 *         name: examId
 *         schema:
 *           type: string
 *         description: Filter by exam ID
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *         description: Filter by student ID
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *         description: Filter by event type
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by severity
 *       - in: query
 *         name: isReviewed
 *         schema:
 *           type: boolean
 *         description: Filter by review status
 *     responses:
 *       200:
 *         description: Proctoring logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProctoringLog'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 totalLogs:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Proctor access required
 *       500:
 *         description: Server error
 */
router.get('/logs', authenticate, authorizeRoles('admin', 'proctor'), getProctoringLogs);

/**
 * @swagger
 * /api/proctoring/logs/{studentId}/{examId}:
 *   get:
 *     summary: Get proctoring logs for a specific student and exam (Admin/Proctor only)
 *     tags: [Proctoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student user ID
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID
 *     responses:
 *       200:
 *         description: Student proctoring logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProctoringLog'
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalEvents:
 *                       type: integer
 *                     bySeverity:
 *                       type: object
 *                     byEventType:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Proctor access required
 *       404:
 *         description: Student or exam not found
 *       500:
 *         description: Server error
 */
router.get('/logs/:studentId/:examId', authenticate, authorizeRoles('admin', 'proctor'), getStudentProctoringLogs);

/**
 * @swagger
 * /api/proctoring/logs/{logId}/review:
 *   put:
 *     summary: Review and add notes to a proctoring log (Admin/Proctor only)
 *     tags: [Proctoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *         description: Proctoring log ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reviewNotes:
 *                 type: string
 *                 example: "Reviewed - appears to be accidental tab switch, no cheating suspected"
 *               isReviewed:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Proctoring log reviewed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 log:
 *                   $ref: '#/components/schemas/ProctoringLog'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Proctor access required
 *       404:
 *         description: Log not found
 *       500:
 *         description: Server error
 */
router.put('/logs/:logId/review', authenticate, authorizeRoles('admin', 'proctor'), reviewProctoringLog);

/**
 * @swagger
 * /api/proctoring/flagged:
 *   get:
 *     summary: Get exams flagged due to proctoring violations (Admin/Proctor only)
 *     tags: [Proctoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of flagged exams per page
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Minimum severity level
 *     responses:
 *       200:
 *         description: Flagged exams retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 flaggedResults:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       result:
 *                         $ref: '#/components/schemas/Result'
 *                       student:
 *                         $ref: '#/components/schemas/User'
 *                       exam:
 *                         $ref: '#/components/schemas/Exam'
 *                       flagCount:
 *                         type: integer
 *                       highestSeverity:
 *                         type: string
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 totalFlagged:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Proctor access required
 *       500:
 *         description: Server error
 */
router.get('/flagged', authenticate, authorizeRoles('admin', 'proctor'), getFlaggedExams);

/**
 * @swagger
 * /api/proctoring/stats:
 *   get:
 *     summary: Get proctoring statistics (Admin/Proctor only)
 *     tags: [Proctoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: examId
 *         schema:
 *           type: string
 *         description: Filter by specific exam
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for statistics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for statistics
 *     responses:
 *       200:
 *         description: Proctoring statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalEvents:
 *                   type: integer
 *                 bySeverity:
 *                   type: object
 *                   properties:
 *                     low:
 *                       type: integer
 *                     medium:
 *                       type: integer
 *                     high:
 *                       type: integer
 *                     critical:
 *                       type: integer
 *                 byEventType:
 *                   type: object
 *                   additionalProperties:
 *                     type: integer
 *                 recentLogs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProctoringLog'
 *                 trendsOverTime:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       count:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Proctor access required
 *       500:
 *         description: Server error
 */
router.get('/stats', authenticate, authorizeRoles('admin', 'proctor'), getProctoringStats);

/**
 * @swagger
 * /api/proctoring/active-sessions:
 *   get:
 *     summary: Get active exam sessions with recent flags (Admin/Proctor only)
 *     tags: [Proctoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activeSessions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       result:
 *                         $ref: '#/components/schemas/Result'
 *                       student:
 *                         $ref: '#/components/schemas/User'
 *                       exam:
 *                         $ref: '#/components/schemas/Exam'
 *                       recentFlags:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/ProctoringLog'
 *                       flagCount:
 *                         type: integer
 *                 totalActive:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Proctor access required
 *       500:
 *         description: Server error
 */
router.get('/active-sessions', authenticate, authorizeRoles('admin', 'proctor'), getActiveSessions);

/**
 * @swagger
 * /api/proctoring/terminate/{resultId}:
 *   post:
 *     summary: Terminate an exam session (Admin/Proctor only)
 *     tags: [Proctoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resultId
 *         required: true
 *         schema:
 *           type: string
 *         description: Result ID of the exam session to terminate
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for termination
 *                 example: "Multiple severe proctoring violations detected"
 *     responses:
 *       200:
 *         description: Exam session terminated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 result:
 *                   $ref: '#/components/schemas/Result'
 *       400:
 *         description: Exam already submitted or not in progress
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Proctor access required
 *       404:
 *         description: Result not found
 *       500:
 *         description: Server error
 */
router.post('/terminate/:resultId', authenticate, authorizeRoles('admin', 'proctor'), terminateExam);

export default router;
