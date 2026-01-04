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
    getExamStats,
    assignProctors,
    removeProctor,
    getProctorExams,
    getAvailableProctors,
    sendExamReminders
} from '../Controllers/examController.js';
import { authenticate, isAdmin, isStudent, isProctor } from '../Middleware/Middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/exams/available:
 *   get:
 *     summary: Get available exams for enrollment
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: Available exams retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exams:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Exam'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/available', authenticate, getAvailableExams);

/**
 * @swagger
 * /api/exams/enrolled:
 *   get:
 *     summary: Get exams the current student is enrolled in
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Enrolled exams retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exams:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Exam'
 *                       - type: object
 *                         properties:
 *                           isCompleted:
 *                             type: boolean
 *                           attemptCount:
 *                             type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/enrolled', authenticate, getEnrolledExams);

/**
 * @swagger
 * /api/exams/stats:
 *   get:
 *     summary: Get exam statistics (Admin only)
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Exam statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalExams:
 *                   type: integer
 *                 activeExams:
 *                   type: integer
 *                 scheduledExams:
 *                   type: integer
 *                 completedExams:
 *                   type: integer
 *                 draftExams:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get('/stats', authenticate, isAdmin, getExamStats);

/**
 * @swagger
 * /api/exams:
 *   post:
 *     summary: Create a new exam (Admin only)
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - duration
 *               - scheduledDate
 *               - startTime
 *               - endTime
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Mathematics Final Exam"
 *               description:
 *                 type: string
 *                 example: "End of semester mathematics exam"
 *               instructions:
 *                 type: string
 *                 example: "Read each question carefully"
 *               category:
 *                 type: string
 *                 example: "Mathematics"
 *               duration:
 *                 type: integer
 *                 description: Duration in minutes
 *                 example: 120
 *               perQuestionTime:
 *                 type: integer
 *                 description: Time per question in seconds
 *               scheduledDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-03-15"
 *               startTime:
 *                 type: string
 *                 example: "09:00"
 *               endTime:
 *                 type: string
 *                 example: "11:00"
 *               passingMarks:
 *                 type: number
 *                 example: 40
 *               isProctored:
 *                 type: boolean
 *                 default: false
 *               proctoringSettings:
 *                 type: object
 *                 properties:
 *                   videoMonitoring:
 *                     type: boolean
 *                   browserLockdown:
 *                     type: boolean
 *                   identityVerification:
 *                     type: boolean
 *                   tabSwitchLimit:
 *                     type: integer
 *               shuffleQuestions:
 *                 type: boolean
 *                 default: false
 *               shuffleOptions:
 *                 type: boolean
 *                 default: false
 *               showResultImmediately:
 *                 type: boolean
 *                 default: true
 *               allowReview:
 *                 type: boolean
 *                 default: true
 *               maxAttempts:
 *                 type: integer
 *                 default: 1
 *               status:
 *                 type: string
 *                 enum: [draft, scheduled]
 *                 default: draft
 *     responses:
 *       201:
 *         description: Exam created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 exam:
 *                   $ref: '#/components/schemas/Exam'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.post('/', authenticate, isAdmin, createExam);

/**
 * @swagger
 * /api/exams:
 *   get:
 *     summary: Get all exams with pagination and filtering (Admin only)
 *     tags: [Exams]
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
 *         description: Number of exams per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, scheduled, active, completed, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title
 *     responses:
 *       200:
 *         description: Exams retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exams:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Exam'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 totalExams:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get('/', authenticate, isAdmin, getAllExams);

/**
 * @swagger
 * /api/exams/{examId}:
 *   get:
 *     summary: Get exam by ID with questions
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID
 *     responses:
 *       200:
 *         description: Exam retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exam:
 *                   $ref: '#/components/schemas/Exam'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Exam not found
 *       500:
 *         description: Server error
 */
router.get('/:examId', authenticate, getExamById);

/**
 * @swagger
 * /api/exams/{examId}:
 *   put:
 *     summary: Update exam details (Admin only)
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               instructions:
 *                 type: string
 *               category:
 *                 type: string
 *               duration:
 *                 type: integer
 *               perQuestionTime:
 *                 type: integer
 *               scheduledDate:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               passingMarks:
 *                 type: number
 *               isProctored:
 *                 type: boolean
 *               proctoringSettings:
 *                 type: object
 *               shuffleQuestions:
 *                 type: boolean
 *               shuffleOptions:
 *                 type: boolean
 *               showResultImmediately:
 *                 type: boolean
 *               allowReview:
 *                 type: boolean
 *               maxAttempts:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [draft, scheduled, active, completed, cancelled]
 *     responses:
 *       200:
 *         description: Exam updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 exam:
 *                   $ref: '#/components/schemas/Exam'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Exam not found
 *       500:
 *         description: Server error
 */
router.put('/:examId', authenticate, isAdmin, updateExam);

/**
 * @swagger
 * /api/exams/{examId}:
 *   delete:
 *     summary: Delete an exam (Admin only)
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID
 *     responses:
 *       200:
 *         description: Exam deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Exam not found
 *       500:
 *         description: Server error
 */
router.delete('/:examId', authenticate, isAdmin, deleteExam);

/**
 * @swagger
 * /api/exams/{examId}/questions:
 *   post:
 *     summary: Add questions to an exam (Admin only)
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionIds
 *             properties:
 *               questionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of question IDs to add
 *                 example: ["60d5ec9af682fbd12a892e1c", "60d5ec9af682fbd12a892e1d"]
 *     responses:
 *       200:
 *         description: Questions added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 exam:
 *                   $ref: '#/components/schemas/Exam'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Exam not found
 *       500:
 *         description: Server error
 */
router.post('/:examId/questions', authenticate, isAdmin, addQuestionsToExam);

/**
 * @swagger
 * /api/exams/{examId}/questions/{questionId}:
 *   delete:
 *     summary: Remove a question from an exam (Admin only)
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *     responses:
 *       200:
 *         description: Question removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 exam:
 *                   $ref: '#/components/schemas/Exam'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Exam or question not found
 *       500:
 *         description: Server error
 */
router.delete('/:examId/questions/:questionId', authenticate, isAdmin, removeQuestionFromExam);

/**
 * @swagger
 * /api/exams/{examId}/enroll:
 *   post:
 *     summary: Enroll in an exam
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID
 *     responses:
 *       200:
 *         description: Enrolled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Already enrolled or exam not available
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Exam not found
 *       500:
 *         description: Server error
 */
router.post('/:examId/enroll', authenticate, enrollInExam);

/**
 * @swagger
 * /api/exams/{examId}/start:
 *   post:
 *     summary: Start or resume an exam
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID
 *     responses:
 *       200:
 *         description: Exam started/resumed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 result:
 *                   $ref: '#/components/schemas/Result'
 *                 exam:
 *                   $ref: '#/components/schemas/Exam'
 *                 questions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Question'
 *       400:
 *         description: Not enrolled, max attempts reached, or exam not active
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Exam not found
 *       500:
 *         description: Server error
 */
router.post('/:examId/start', authenticate, startExam);

/**
 * @swagger
 * /api/exams/answer/{resultId}:
 *   post:
 *     summary: Save an answer during exam
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resultId
 *         required: true
 *         schema:
 *           type: string
 *         description: Result ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionId
 *               - selectedOption
 *             properties:
 *               questionId:
 *                 type: string
 *                 description: Question ID
 *               selectedOption:
 *                 type: string
 *                 description: Selected answer/option
 *               timeTaken:
 *                 type: number
 *                 description: Time taken for this question in seconds
 *     responses:
 *       200:
 *         description: Answer saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Exam already submitted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Result not found
 *       500:
 *         description: Server error
 */
router.post('/answer/:resultId', authenticate, saveAnswer);

/**
 * @swagger
 * /api/exams/submit/{resultId}:
 *   post:
 *     summary: Submit completed exam
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resultId
 *         required: true
 *         schema:
 *           type: string
 *         description: Result ID
 *     responses:
 *       200:
 *         description: Exam submitted successfully
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
 *         description: Exam already submitted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Result not found
 *       500:
 *         description: Server error
 */
router.post('/submit/:resultId', authenticate, submitExam);

/**
 * @swagger
 * /api/exams/proctors/available:
 *   get:
 *     summary: Get list of available proctors (Admin only)
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available proctors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 proctors:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get('/proctors/available', authenticate, isAdmin, getAvailableProctors);

/**
 * @swagger
 * /api/exams/proctors/my-exams:
 *   get:
 *     summary: Get exams assigned to the current proctor (Proctor only)
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Proctor's exams retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exams:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Exam'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Proctor access required
 *       500:
 *         description: Server error
 */
router.get('/proctors/my-exams', authenticate, isProctor, getProctorExams);

/**
 * @swagger
 * /api/exams/{examId}/proctors:
 *   post:
 *     summary: Assign proctors to an exam (Admin only)
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - proctorIds
 *             properties:
 *               proctorIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of proctor user IDs
 *                 example: ["60d5ec9af682fbd12a892e1c"]
 *     responses:
 *       200:
 *         description: Proctors assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 exam:
 *                   $ref: '#/components/schemas/Exam'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Exam not found
 *       500:
 *         description: Server error
 */
router.post('/:examId/proctors', authenticate, isAdmin, assignProctors);

/**
 * @swagger
 * /api/exams/{examId}/proctors/{proctorId}:
 *   delete:
 *     summary: Remove proctor from an exam (Admin only)
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID
 *       - in: path
 *         name: proctorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Proctor user ID
 *     responses:
 *       200:
 *         description: Proctor removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 exam:
 *                   $ref: '#/components/schemas/Exam'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Exam or proctor not found
 *       500:
 *         description: Server error
 */
router.delete('/:examId/proctors/:proctorId', authenticate, isAdmin, removeProctor);

/**
 * @swagger
 * /api/exams/{examId}/send-reminders:
 *   post:
 *     summary: Send exam reminder emails to enrolled students (Admin only)
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID
 *     responses:
 *       200:
 *         description: Reminders sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 sentCount:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Exam not found
 *       500:
 *         description: Server error
 */
router.post('/:examId/send-reminders', authenticate, isAdmin, sendExamReminders);

export default router;
