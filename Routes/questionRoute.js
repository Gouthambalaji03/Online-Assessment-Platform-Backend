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

/**
 * @swagger
 * /api/questions/categories:
 *   get:
 *     summary: Get all question categories
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Mathematics", "Science", "Programming"]
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/categories', authenticate, getCategories);

/**
 * @swagger
 * /api/questions/topics:
 *   get:
 *     summary: Get all topics (optionally filtered by category)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter topics by category
 *     responses:
 *       200:
 *         description: List of topics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 topics:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Algebra", "Calculus", "Statistics"]
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/topics', authenticate, getTopics);

/**
 * @swagger
 * /api/questions/stats:
 *   get:
 *     summary: Get question statistics (Admin only)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Question statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalQuestions:
 *                   type: integer
 *                   example: 150
 *                 byType:
 *                   type: object
 *                   properties:
 *                     mcq:
 *                       type: integer
 *                     true_false:
 *                       type: integer
 *                     short_answer:
 *                       type: integer
 *                 byDifficulty:
 *                   type: object
 *                   properties:
 *                     easy:
 *                       type: integer
 *                     medium:
 *                       type: integer
 *                     hard:
 *                       type: integer
 *                 byCategory:
 *                   type: object
 *                   additionalProperties:
 *                     type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get('/stats', authenticate, isAdmin, getQuestionStats);

/**
 * @swagger
 * /api/questions:
 *   post:
 *     summary: Create a new question (Admin only)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionText
 *               - questionType
 *               - category
 *               - topic
 *             properties:
 *               questionText:
 *                 type: string
 *                 example: "What is 2 + 2?"
 *               questionType:
 *                 type: string
 *                 enum: [mcq, true_false, short_answer]
 *                 example: mcq
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     optionText:
 *                       type: string
 *                     isCorrect:
 *                       type: boolean
 *                 example: [{"optionText": "3", "isCorrect": false}, {"optionText": "4", "isCorrect": true}]
 *               correctAnswer:
 *                 type: string
 *                 description: For true_false or short_answer questions
 *               category:
 *                 type: string
 *                 example: "Mathematics"
 *               topic:
 *                 type: string
 *                 example: "Arithmetic"
 *               difficultyLevel:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *                 default: medium
 *               marks:
 *                 type: number
 *                 default: 1
 *               negativeMarks:
 *                 type: number
 *                 default: 0
 *               explanation:
 *                 type: string
 *                 example: "Basic addition"
 *     responses:
 *       201:
 *         description: Question created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 question:
 *                   $ref: '#/components/schemas/Question'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.post('/', authenticate, isAdmin, createQuestion);

/**
 * @swagger
 * /api/questions/bulk:
 *   post:
 *     summary: Create multiple questions in bulk (Admin only)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questions
 *             properties:
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - questionText
 *                     - questionType
 *                     - category
 *                     - topic
 *                   properties:
 *                     questionText:
 *                       type: string
 *                     questionType:
 *                       type: string
 *                       enum: [mcq, true_false, short_answer]
 *                     options:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           optionText:
 *                             type: string
 *                           isCorrect:
 *                             type: boolean
 *                     correctAnswer:
 *                       type: string
 *                     category:
 *                       type: string
 *                     topic:
 *                       type: string
 *                     difficultyLevel:
 *                       type: string
 *                       enum: [easy, medium, hard]
 *                     marks:
 *                       type: number
 *                     negativeMarks:
 *                       type: number
 *                     explanation:
 *                       type: string
 *     responses:
 *       201:
 *         description: Questions created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 questions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Question'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.post('/bulk', authenticate, isAdmin, createBulkQuestions);

/**
 * @swagger
 * /api/questions:
 *   get:
 *     summary: Get all questions with filtering and pagination (Admin only)
 *     tags: [Questions]
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
 *         description: Number of questions per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: topic
 *         schema:
 *           type: string
 *         description: Filter by topic
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *         description: Filter by difficulty level
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [mcq, true_false, short_answer]
 *         description: Filter by question type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in question text
 *     responses:
 *       200:
 *         description: Questions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 questions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Question'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 totalQuestions:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get('/', authenticate, isAdmin, getAllQuestions);

/**
 * @swagger
 * /api/questions/{questionId}:
 *   get:
 *     summary: Get question by ID (Admin only)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *     responses:
 *       200:
 *         description: Question retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 question:
 *                   $ref: '#/components/schemas/Question'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Question not found
 *       500:
 *         description: Server error
 */
router.get('/:questionId', authenticate, isAdmin, getQuestionById);

/**
 * @swagger
 * /api/questions/{questionId}:
 *   put:
 *     summary: Update a question (Admin only)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               questionText:
 *                 type: string
 *               questionType:
 *                 type: string
 *                 enum: [mcq, true_false, short_answer]
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     optionText:
 *                       type: string
 *                     isCorrect:
 *                       type: boolean
 *               correctAnswer:
 *                 type: string
 *               category:
 *                 type: string
 *               topic:
 *                 type: string
 *               difficultyLevel:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *               marks:
 *                 type: number
 *               negativeMarks:
 *                 type: number
 *               explanation:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Question updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 question:
 *                   $ref: '#/components/schemas/Question'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Question not found
 *       500:
 *         description: Server error
 */
router.put('/:questionId', authenticate, isAdmin, updateQuestion);

/**
 * @swagger
 * /api/questions/{questionId}:
 *   delete:
 *     summary: Delete a question (soft delete - marks as inactive) (Admin only)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *     responses:
 *       200:
 *         description: Question deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Question not found
 *       500:
 *         description: Server error
 */
router.delete('/:questionId', authenticate, isAdmin, deleteQuestion);

export default router;
