import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Online Assessment Platform API',
            version: '1.0.0',
            description: 'A comprehensive online assessment and examination platform with proctoring capabilities',
            contact: {
                name: 'Goutham Balaji P S',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter JWT token obtained from login',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', description: 'User ID' },
                        firstName: { type: 'string', description: 'First name' },
                        lastName: { type: 'string', description: 'Last name' },
                        email: { type: 'string', format: 'email', description: 'Email address' },
                        role: { type: 'string', enum: ['student', 'admin', 'proctor'], description: 'User role' },
                        profilePicture: { type: 'string', description: 'Profile picture URL' },
                        phone: { type: 'string', description: 'Phone number' },
                        isVerified: { type: 'boolean', description: 'Email verification status' },
                        enrolledExams: { type: 'array', items: { type: 'string' }, description: 'List of enrolled exam IDs' },
                        createdAt: { type: 'string', format: 'date-time' },
                        lastLogin: { type: 'string', format: 'date-time' },
                    },
                },
                Question: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', description: 'Question ID' },
                        questionText: { type: 'string', description: 'The question text' },
                        questionType: { type: 'string', enum: ['mcq', 'true_false', 'short_answer'], description: 'Type of question' },
                        options: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    optionText: { type: 'string' },
                                    isCorrect: { type: 'boolean' },
                                },
                            },
                            description: 'Options for MCQ questions',
                        },
                        correctAnswer: { type: 'string', description: 'Correct answer for true_false/short_answer' },
                        category: { type: 'string', description: 'Question category' },
                        topic: { type: 'string', description: 'Question topic' },
                        difficultyLevel: { type: 'string', enum: ['easy', 'medium', 'hard'] },
                        marks: { type: 'number', description: 'Marks for correct answer' },
                        negativeMarks: { type: 'number', description: 'Negative marks for wrong answer' },
                        explanation: { type: 'string', description: 'Explanation for the answer' },
                        isActive: { type: 'boolean' },
                        createdBy: { type: 'string', description: 'Creator user ID' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Exam: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', description: 'Exam ID' },
                        title: { type: 'string', description: 'Exam title' },
                        description: { type: 'string', description: 'Exam description' },
                        instructions: { type: 'string', description: 'Exam instructions' },
                        category: { type: 'string', description: 'Exam category' },
                        questions: { type: 'array', items: { type: 'string' }, description: 'List of question IDs' },
                        totalMarks: { type: 'number', description: 'Total marks' },
                        passingMarks: { type: 'number', description: 'Passing marks' },
                        duration: { type: 'number', description: 'Duration in minutes' },
                        perQuestionTime: { type: 'number', description: 'Time per question in seconds' },
                        scheduledDate: { type: 'string', format: 'date', description: 'Scheduled date' },
                        startTime: { type: 'string', description: 'Start time (HH:MM)' },
                        endTime: { type: 'string', description: 'End time (HH:MM)' },
                        isProctored: { type: 'boolean', description: 'Whether exam is proctored' },
                        proctoringSettings: {
                            type: 'object',
                            properties: {
                                videoMonitoring: { type: 'boolean' },
                                browserLockdown: { type: 'boolean' },
                                identityVerification: { type: 'boolean' },
                                tabSwitchLimit: { type: 'number' },
                            },
                        },
                        shuffleQuestions: { type: 'boolean' },
                        shuffleOptions: { type: 'boolean' },
                        showResultImmediately: { type: 'boolean' },
                        allowReview: { type: 'boolean' },
                        maxAttempts: { type: 'number' },
                        enrolledStudents: { type: 'array', items: { type: 'string' } },
                        assignedProctors: { type: 'array', items: { type: 'string' } },
                        createdBy: { type: 'string' },
                        status: { type: 'string', enum: ['draft', 'scheduled', 'active', 'completed', 'cancelled'] },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Result: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', description: 'Result ID' },
                        exam: { type: 'string', description: 'Exam ID' },
                        student: { type: 'string', description: 'Student user ID' },
                        answers: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    question: { type: 'string' },
                                    selectedOption: { type: 'string' },
                                    isCorrect: { type: 'boolean' },
                                    marksObtained: { type: 'number' },
                                    timeTaken: { type: 'number' },
                                },
                            },
                        },
                        totalMarks: { type: 'number' },
                        obtainedMarks: { type: 'number' },
                        percentage: { type: 'number' },
                        isPassed: { type: 'boolean' },
                        correctAnswers: { type: 'number' },
                        wrongAnswers: { type: 'number' },
                        unanswered: { type: 'number' },
                        timeTaken: { type: 'number', description: 'Time taken in seconds' },
                        startedAt: { type: 'string', format: 'date-time' },
                        submittedAt: { type: 'string', format: 'date-time' },
                        status: { type: 'string', enum: ['in_progress', 'submitted', 'evaluated', 'flagged'] },
                        attemptNumber: { type: 'number' },
                        proctoringFlags: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    type: { type: 'string' },
                                    timestamp: { type: 'string', format: 'date-time' },
                                    description: { type: 'string' },
                                },
                            },
                        },
                        feedback: { type: 'string' },
                        reviewedBy: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                ProctoringLog: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', description: 'Log ID' },
                        exam: { type: 'string', description: 'Exam ID' },
                        student: { type: 'string', description: 'Student user ID' },
                        result: { type: 'string', description: 'Result ID' },
                        eventType: {
                            type: 'string',
                            enum: [
                                'tab_switch', 'window_blur', 'copy_paste', 'right_click',
                                'fullscreen_exit', 'face_not_detected', 'multiple_faces',
                                'suspicious_movement', 'browser_resize', 'devtools_open',
                                'screenshot_attempt', 'identity_mismatch', 'network_disconnect',
                                'exam_started', 'exam_submitted', 'exam_terminated'
                            ],
                        },
                        description: { type: 'string' },
                        severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                        screenshot: { type: 'string', description: 'Screenshot URL/base64' },
                        metadata: { type: 'object' },
                        isReviewed: { type: 'boolean' },
                        reviewedBy: { type: 'string' },
                        reviewNotes: { type: 'string' },
                        timestamp: { type: 'string', format: 'date-time' },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', description: 'Error message' },
                        error: { type: 'string', description: 'Error details' },
                    },
                },
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', description: 'Success message' },
                    },
                },
            },
        },
        tags: [
            { name: 'Authentication', description: 'User authentication and profile management' },
            { name: 'Questions', description: 'Question bank management' },
            { name: 'Exams', description: 'Exam creation and management' },
            { name: 'Results', description: 'Exam results and analytics' },
            { name: 'Proctoring', description: 'Proctoring system and monitoring' },
        ],
    },
    apis: ['./Routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Online Assessment Platform API',
    }));

    // Serve swagger.json
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });
};

export default setupSwagger;
