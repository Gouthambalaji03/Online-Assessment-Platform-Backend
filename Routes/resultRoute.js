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

/**
 * @swagger
 * /api/results/my-results:
 *   get:
 *     summary: Get all results for current student
 *     tags: [Results]
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
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Result'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/my-results', authenticate, getStudentResults);

/**
 * @swagger
 * /api/results/my-analytics:
 *   get:
 *     summary: Get analytics for current student
 *     tags: [Results]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalExams:
 *                   type: integer
 *                 passedExams:
 *                   type: integer
 *                 failedExams:
 *                   type: integer
 *                 passRate:
 *                   type: number
 *                 averageScore:
 *                   type: number
 *                 categoryPerformance:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       attempts:
 *                         type: integer
 *                       avgScore:
 *                         type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/my-analytics', authenticate, getStudentAnalytics);

/**
 * @swagger
 * /api/results/my-trends:
 *   get:
 *     summary: Get performance trends for current student
 *     tags: [Results]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance trends retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trends:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       score:
 *                         type: number
 *                       examTitle:
 *                         type: string
 *                 improvementScore:
 *                   type: number
 *                   description: Improvement percentage compared to first exams
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/my-trends', authenticate, getStudentPerformanceTrends);

/**
 * @swagger
 * /api/results/my-export:
 *   get:
 *     summary: Export current student's results as CSV
 *     tags: [Results]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file downloaded
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/my-export', authenticate, exportStudentResultsCSV);

/**
 * @swagger
 * /api/results/dashboard:
 *   get:
 *     summary: Get admin dashboard statistics (Admin only)
 *     tags: [Results]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalResults:
 *                   type: integer
 *                 totalStudents:
 *                   type: integer
 *                 overallPassRate:
 *                   type: number
 *                 averageScore:
 *                   type: number
 *                 recentResults:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Result'
 *                 scoreTrends:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       avgScore:
 *                         type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get('/dashboard', authenticate, isAdmin, getDashboardStats);

/**
 * @swagger
 * /api/results/pending-grading:
 *   get:
 *     summary: Get results with unevaluated short answer questions (Admin only)
 *     tags: [Results]
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
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Pending grading results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Result'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 totalPending:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get('/pending-grading', authenticate, isAdmin, getPendingGrading);

/**
 * @swagger
 * /api/results/exam/{examId}:
 *   get:
 *     summary: Get all results for a specific exam (Admin only)
 *     tags: [Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID
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
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Exam results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Result'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 totalResults:
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
router.get('/exam/:examId', authenticate, isAdmin, getExamResults);

/**
 * @swagger
 * /api/results/exam/{examId}/analytics:
 *   get:
 *     summary: Get analytics for a specific exam (Admin only)
 *     tags: [Results]
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
 *         description: Exam analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalAttempts:
 *                   type: integer
 *                 passCount:
 *                   type: integer
 *                 failCount:
 *                   type: integer
 *                 passRate:
 *                   type: number
 *                 averageScore:
 *                   type: number
 *                 highestScore:
 *                   type: number
 *                 lowestScore:
 *                   type: number
 *                 scoreDistribution:
 *                   type: object
 *                   description: Score ranges and counts
 *                 questionWiseAccuracy:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       questionId:
 *                         type: string
 *                       questionText:
 *                         type: string
 *                       correctPercentage:
 *                         type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Exam not found
 *       500:
 *         description: Server error
 */
router.get('/exam/:examId/analytics', authenticate, isAdmin, getExamAnalytics);

/**
 * @swagger
 * /api/results/exam/{examId}/export:
 *   get:
 *     summary: Export exam results as CSV (Admin only)
 *     tags: [Results]
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
 *         description: CSV file downloaded
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Exam not found
 *       500:
 *         description: Server error
 */
router.get('/exam/:examId/export', authenticate, isAdmin, exportExamResultsCSV);

/**
 * @swagger
 * /api/results/student/{studentId}/analytics:
 *   get:
 *     summary: Get analytics for a specific student (Admin/Proctor only)
 *     tags: [Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student user ID
 *     responses:
 *       200:
 *         description: Student analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalExams:
 *                   type: integer
 *                 passedExams:
 *                   type: integer
 *                 failedExams:
 *                   type: integer
 *                 passRate:
 *                   type: number
 *                 averageScore:
 *                   type: number
 *                 categoryPerformance:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Proctor access required
 *       404:
 *         description: Student not found
 *       500:
 *         description: Server error
 */
router.get('/student/:studentId/analytics', authenticate, authorizeRoles('admin', 'proctor'), getStudentAnalytics);

/**
 * @swagger
 * /api/results/student/{studentId}/trends:
 *   get:
 *     summary: Get performance trends for a specific student (Admin/Proctor only)
 *     tags: [Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student user ID
 *     responses:
 *       200:
 *         description: Student performance trends retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trends:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       score:
 *                         type: number
 *                       examTitle:
 *                         type: string
 *                 improvementScore:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Proctor access required
 *       404:
 *         description: Student not found
 *       500:
 *         description: Server error
 */
router.get('/student/:studentId/trends', authenticate, authorizeRoles('admin', 'proctor'), getStudentPerformanceTrends);

/**
 * @swagger
 * /api/results/student/{studentId}/export:
 *   get:
 *     summary: Export specific student's results as CSV (Admin only)
 *     tags: [Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student user ID
 *     responses:
 *       200:
 *         description: CSV file downloaded
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Student not found
 *       500:
 *         description: Server error
 */
router.get('/student/:studentId/export', authenticate, isAdmin, exportStudentResultsCSV);

/**
 * @swagger
 * /api/results/{resultId}:
 *   get:
 *     summary: Get detailed result by ID
 *     tags: [Results]
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
 *         description: Result retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/Result'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to view this result
 *       404:
 *         description: Result not found
 *       500:
 *         description: Server error
 */
router.get('/:resultId', authenticate, getResultById);

/**
 * @swagger
 * /api/results/{resultId}/feedback:
 *   put:
 *     summary: Add feedback to a result (Admin only)
 *     tags: [Results]
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
 *               - feedback
 *             properties:
 *               feedback:
 *                 type: string
 *                 example: "Good performance, but need to improve on calculus topics."
 *     responses:
 *       200:
 *         description: Feedback added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 result:
 *                   $ref: '#/components/schemas/Result'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Result not found
 *       500:
 *         description: Server error
 */
router.put('/:resultId/feedback', authenticate, isAdmin, addFeedback);

/**
 * @swagger
 * /api/results/{resultId}/grade/{answerId}:
 *   put:
 *     summary: Grade a single short answer question (Admin only)
 *     tags: [Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resultId
 *         required: true
 *         schema:
 *           type: string
 *         description: Result ID
 *       - in: path
 *         name: answerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Answer ID within the result
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - marksObtained
 *             properties:
 *               marksObtained:
 *                 type: number
 *                 description: Marks awarded for this answer
 *                 example: 5
 *               isCorrect:
 *                 type: boolean
 *                 description: Whether the answer is correct
 *                 example: true
 *     responses:
 *       200:
 *         description: Answer graded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 result:
 *                   $ref: '#/components/schemas/Result'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Result or answer not found
 *       500:
 *         description: Server error
 */
router.put('/:resultId/grade/:answerId', authenticate, isAdmin, gradeShortAnswer);

/**
 * @swagger
 * /api/results/{resultId}/bulk-grade:
 *   put:
 *     summary: Grade multiple answers at once (Admin only)
 *     tags: [Results]
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
 *               - grades
 *             properties:
 *               grades:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - answerId
 *                     - marksObtained
 *                   properties:
 *                     answerId:
 *                       type: string
 *                       description: Answer ID
 *                     marksObtained:
 *                       type: number
 *                       description: Marks awarded
 *                     isCorrect:
 *                       type: boolean
 *                       description: Whether the answer is correct
 *                 example: [{"answerId": "abc123", "marksObtained": 5, "isCorrect": true}]
 *     responses:
 *       200:
 *         description: Answers graded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 result:
 *                   $ref: '#/components/schemas/Result'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Result not found
 *       500:
 *         description: Server error
 */
router.put('/:resultId/bulk-grade', authenticate, isAdmin, bulkGradeResult);

export default router;
