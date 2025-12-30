import Exam from "../Models/examModel.js";
import Question from "../Models/questionModel.js";
import User from "../Models/userModel.js";
import Result from "../Models/resultModel.js";
import { sendResultEmail, sendExamReminderEmail } from "../Utils/mailer.js";

export const createExam = async (req, res) => {
    try {
        const examData = {
            ...req.body,
            createdBy: req.user.userId
        };

        if (examData.questions && examData.questions.length > 0) {
            const questions = await Question.find({ _id: { $in: examData.questions } });
            examData.totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
        }

        const exam = new Exam(examData);
        await exam.save();

        res.status(201).json({ message: "Exam created successfully", exam });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getAllExams = async (req, res) => {
    try {
        const { status, category, page = 1, limit = 10 } = req.query;
        const query = {};

        if (status) query.status = status;
        if (category) query.category = category;

        const exams = await Exam.find(query)
            .populate('createdBy', 'firstName lastName')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ scheduledDate: -1 });

        const total = await Exam.countDocuments(query);

        res.status(200).json({
            exams,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getExamById = async (req, res) => {
    try {
        const { examId } = req.params;

        const exam = await Exam.findById(examId)
            .populate('createdBy', 'firstName lastName')
            .populate('questions');

        if (!exam) {
            return res.status(404).json({ message: "Exam not found" });
        }

        res.status(200).json(exam);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateExam = async (req, res) => {
    try {
        const { examId } = req.params;

        let updateData = { ...req.body, updatedAt: Date.now() };

        if (updateData.questions && updateData.questions.length > 0) {
            const questions = await Question.find({ _id: { $in: updateData.questions } });
            updateData.totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
        }

        const exam = await Exam.findByIdAndUpdate(examId, updateData, { new: true });

        if (!exam) {
            return res.status(404).json({ message: "Exam not found" });
        }

        res.status(200).json({ message: "Exam updated successfully", exam });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const deleteExam = async (req, res) => {
    try {
        const { examId } = req.params;

        const exam = await Exam.findByIdAndDelete(examId);
        if (!exam) {
            return res.status(404).json({ message: "Exam not found" });
        }

        res.status(200).json({ message: "Exam deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const addQuestionsToExam = async (req, res) => {
    try {
        const { examId } = req.params;
        const { questionIds } = req.body;

        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({ message: "Exam not found" });
        }

        const newQuestions = questionIds.filter(id => !exam.questions.includes(id));
        exam.questions.push(...newQuestions);

        const allQuestions = await Question.find({ _id: { $in: exam.questions } });
        exam.totalMarks = allQuestions.reduce((sum, q) => sum + q.marks, 0);
        exam.updatedAt = Date.now();

        await exam.save();

        res.status(200).json({ message: "Questions added successfully", exam });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const removeQuestionFromExam = async (req, res) => {
    try {
        const { examId, questionId } = req.params;

        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({ message: "Exam not found" });
        }

        exam.questions = exam.questions.filter(q => q.toString() !== questionId);

        const allQuestions = await Question.find({ _id: { $in: exam.questions } });
        exam.totalMarks = allQuestions.reduce((sum, q) => sum + q.marks, 0);
        exam.updatedAt = Date.now();

        await exam.save();

        res.status(200).json({ message: "Question removed successfully", exam });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getAvailableExams = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const userId = req.user.userId;

        // Get start of today (midnight) for date comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find exams that are:
        // 1. Status is 'scheduled' or 'active'
        // 2. Scheduled date is today or in the future
        // 3. User is NOT already enrolled
        const exams = await Exam.find({
            status: { $in: ['scheduled', 'active'] },
            scheduledDate: { $gte: today },
            enrolledStudents: { $ne: userId }
        })
            .select('-questions')
            .populate('createdBy', 'firstName lastName')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ scheduledDate: 1 });

        const total = await Exam.countDocuments({
            status: { $in: ['scheduled', 'active'] },
            scheduledDate: { $gte: today },
            enrolledStudents: { $ne: userId }
        });

        res.status(200).json({
            exams,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const enrollInExam = async (req, res) => {
    try {
        const { examId } = req.params;
        const userId = req.user.userId;

        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({ message: "Exam not found" });
        }

        if (exam.enrolledStudents.includes(userId)) {
            return res.status(400).json({ message: "Already enrolled in this exam" });
        }

        exam.enrolledStudents.push(userId);
        await exam.save();

        await User.findByIdAndUpdate(userId, {
            $push: { enrolledExams: examId }
        });

        res.status(200).json({ message: "Successfully enrolled in exam" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getEnrolledExams = async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await User.findById(userId).populate({
            path: 'enrolledExams',
            select: '-questions',
            populate: { path: 'createdBy', select: 'firstName lastName' }
        });

        // Get all results for this user to check completion status
        const results = await Result.find({
            student: userId,
            status: 'submitted'
        }).select('exam submittedAt obtainedMarks totalMarks percentage isPassed');

        // Create a map of exam completion status
        const completedExams = {};
        results.forEach(result => {
            completedExams[result.exam.toString()] = {
                completed: true,
                submittedAt: result.submittedAt,
                obtainedMarks: result.obtainedMarks,
                totalMarks: result.totalMarks,
                percentage: result.percentage,
                isPassed: result.isPassed
            };
        });

        // Add completion status to each exam
        const examsWithStatus = user.enrolledExams.map(exam => ({
            ...exam.toObject(),
            completionStatus: completedExams[exam._id.toString()] || { completed: false }
        }));

        res.status(200).json(examsWithStatus);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const startExam = async (req, res) => {
    try {
        const { examId } = req.params;
        const userId = req.user.userId;

        const exam = await Exam.findById(examId).populate('questions');
        if (!exam) {
            return res.status(404).json({ message: "Exam not found" });
        }

        if (!exam.enrolledStudents.includes(userId)) {
            return res.status(403).json({ message: "Not enrolled in this exam" });
        }

        // Check if exam has questions
        if (!exam.questions || exam.questions.length === 0) {
            return res.status(400).json({ message: "This exam has no questions. Please contact the administrator." });
        }

        // Check if user already completed this exam
        const completedResult = await Result.findOne({
            exam: examId,
            student: userId,
            status: 'submitted'
        });

        if (completedResult) {
            return res.status(400).json({
                message: "You have already completed this exam",
                resultId: completedResult._id
            });
        }

        const existingResult = await Result.findOne({
            exam: examId,
            student: userId,
            status: 'in_progress'
        });

        if (existingResult) {
            // Return questions for resuming exam
            let questions = exam.questions;
            if (exam.shuffleQuestions) {
                questions = shuffleArray([...questions]);
            }

            const sanitizedQuestions = questions.map(q => ({
                _id: q._id,
                questionText: q.questionText,
                questionType: q.questionType,
                options: q.options.map(o => ({ optionText: o.optionText, _id: o._id })),
                marks: q.marks,
                negativeMarks: q.negativeMarks
            }));

            return res.status(200).json({
                message: "Resuming exam",
                resultId: existingResult._id,
                exam: {
                    _id: exam._id,
                    title: exam.title,
                    duration: exam.duration,
                    perQuestionTime: exam.perQuestionTime,
                    totalMarks: exam.totalMarks,
                    isProctored: exam.isProctored,
                    proctoringSettings: exam.proctoringSettings
                },
                questions: sanitizedQuestions
            });
        }

        const attemptCount = await Result.countDocuments({
            exam: examId,
            student: userId
        });

        if (attemptCount >= (exam.maxAttempts || 1)) {
            return res.status(403).json({ message: "Maximum attempts reached for this exam" });
        }

        const result = new Result({
            exam: examId,
            student: userId,
            totalMarks: exam.totalMarks,
            startedAt: new Date(),
            attemptNumber: attemptCount + 1,
            answers: exam.questions.map(q => ({
                question: q._id,
                selectedOption: null,
                isCorrect: false,
                marksObtained: 0
            }))
        });

        await result.save();

        let questions = exam.questions;
        if (exam.shuffleQuestions) {
            questions = shuffleArray([...questions]);
        }
        if (exam.shuffleOptions) {
            questions = questions.map(q => ({
                ...q.toObject(),
                options: shuffleArray([...q.options])
            }));
        }

        const sanitizedQuestions = questions.map(q => ({
            _id: q._id,
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options.map(o => ({ optionText: o.optionText, _id: o._id })),
            marks: q.marks,
            negativeMarks: q.negativeMarks
        }));

        res.status(200).json({
            message: "Exam started",
            resultId: result._id,
            exam: {
                _id: exam._id,
                title: exam.title,
                duration: exam.duration,
                perQuestionTime: exam.perQuestionTime,
                totalMarks: exam.totalMarks,
                isProctored: exam.isProctored,
                proctoringSettings: exam.proctoringSettings
            },
            questions: sanitizedQuestions
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const saveAnswer = async (req, res) => {
    try {
        const { resultId } = req.params;
        const { questionId, selectedOption, timeTaken } = req.body;

        const result = await Result.findById(resultId);
        if (!result) {
            return res.status(404).json({ message: "Result not found" });
        }

        if (result.status !== 'in_progress') {
            return res.status(400).json({ message: "Exam already submitted" });
        }

        const answerIndex = result.answers.findIndex(
            a => a.question.toString() === questionId
        );

        if (answerIndex !== -1) {
            result.answers[answerIndex].selectedOption = selectedOption;
            result.answers[answerIndex].timeTaken = timeTaken || 0;
        }

        await result.save();

        res.status(200).json({ message: "Answer saved" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const submitExam = async (req, res) => {
    try {
        const { resultId } = req.params;
        const { answers } = req.body;

        const result = await Result.findById(resultId).populate('exam');
        if (!result) {
            return res.status(404).json({ message: "Result not found" });
        }

        if (result.status !== 'in_progress') {
            return res.status(400).json({ message: "Exam already submitted" });
        }

        const exam = await Exam.findById(result.exam._id).populate('questions');

        let obtainedMarks = 0;
        let correctAnswers = 0;
        let wrongAnswers = 0;
        let unanswered = 0;

        for (const answer of result.answers) {
            const submittedAnswer = answers?.find(
                a => a.questionId === answer.question.toString()
            );

            if (submittedAnswer) {
                answer.selectedOption = submittedAnswer.selectedOption;
                answer.timeTaken = submittedAnswer.timeTaken || 0;
            }

            const question = exam.questions.find(
                q => q._id.toString() === answer.question.toString()
            );

            if (!answer.selectedOption) {
                unanswered++;
                continue;
            }

            let isCorrect = false;

            if (question.questionType === 'mcq') {
                const correctOption = question.options.find(o => o.isCorrect);
                isCorrect = correctOption && answer.selectedOption === correctOption._id.toString();
            } else if (question.questionType === 'true_false') {
                isCorrect = answer.selectedOption.toLowerCase() === question.correctAnswer.toLowerCase();
            }

            answer.isCorrect = isCorrect;

            if (isCorrect) {
                answer.marksObtained = question.marks;
                obtainedMarks += question.marks;
                correctAnswers++;
            } else {
                answer.marksObtained = -question.negativeMarks;
                obtainedMarks -= question.negativeMarks;
                wrongAnswers++;
            }
        }

        result.obtainedMarks = Math.max(0, obtainedMarks);
        result.percentage = (result.obtainedMarks / result.totalMarks) * 100;
        result.isPassed = result.obtainedMarks >= exam.passingMarks;
        result.correctAnswers = correctAnswers;
        result.wrongAnswers = wrongAnswers;
        result.unanswered = unanswered;
        result.submittedAt = new Date();
        result.timeTaken = Math.floor((result.submittedAt - result.startedAt) / 1000);
        result.status = 'submitted';

        await result.save();

        // Send result email to student
        try {
            const student = await User.findById(result.student);
            if (student && student.email) {
                await sendResultEmail(student.email, {
                    examTitle: exam.title,
                    obtainedMarks: result.obtainedMarks,
                    totalMarks: result.totalMarks,
                    percentage: result.percentage.toFixed(2),
                    isPassed: result.isPassed,
                    correctAnswers: result.correctAnswers,
                    wrongAnswers: result.wrongAnswers
                });
            }
        } catch (emailError) {
            console.error('Failed to send result email:', emailError);
        }

        if (exam.showResultImmediately) {
            res.status(200).json({
                message: "Exam submitted successfully",
                result: {
                    obtainedMarks: result.obtainedMarks,
                    totalMarks: result.totalMarks,
                    percentage: result.percentage.toFixed(2),
                    isPassed: result.isPassed,
                    correctAnswers: result.correctAnswers,
                    wrongAnswers: result.wrongAnswers,
                    unanswered: result.unanswered,
                    timeTaken: result.timeTaken
                }
            });
        } else {
            res.status(200).json({
                message: "Exam submitted successfully. Results will be available later."
            });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Send exam reminders to enrolled students
export const sendExamReminders = async (req, res) => {
    try {
        const { examId } = req.params;

        const exam = await Exam.findById(examId).populate('enrolledStudents', 'email firstName');
        if (!exam) {
            return res.status(404).json({ message: "Exam not found" });
        }

        const examDetails = {
            title: exam.title,
            date: new Date(exam.scheduledDate).toLocaleDateString(),
            startTime: exam.startTime,
            endTime: exam.endTime,
            duration: exam.duration
        };

        let sentCount = 0;
        for (const student of exam.enrolledStudents) {
            try {
                await sendExamReminderEmail(student.email, examDetails);
                sentCount++;
            } catch (err) {
                console.error(`Failed to send reminder to ${student.email}:`, err);
            }
        }

        res.status(200).json({
            message: `Reminders sent to ${sentCount} students`,
            totalEnrolled: exam.enrolledStudents.length
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getExamStats = async (req, res) => {
    try {
        const totalExams = await Exam.countDocuments();
        const activeExams = await Exam.countDocuments({ status: 'active' });
        const scheduledExams = await Exam.countDocuments({ status: 'scheduled' });
        const completedExams = await Exam.countDocuments({ status: 'completed' });

        const categoryStats = await Exam.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            totalExams,
            activeExams,
            scheduledExams,
            completedExams,
            categoryStats
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const assignProctors = async (req, res) => {
    try {
        const { examId } = req.params;
        const { proctorIds } = req.body;

        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({ message: "Exam not found" });
        }

        // Verify all proctors exist and have proctor role
        const proctors = await User.find({
            _id: { $in: proctorIds },
            role: { $in: ['proctor', 'admin'] }
        });

        if (proctors.length !== proctorIds.length) {
            return res.status(400).json({ message: "Some users are not valid proctors" });
        }

        exam.assignedProctors = proctorIds;
        exam.updatedAt = Date.now();
        await exam.save();

        res.status(200).json({ message: "Proctors assigned successfully", exam });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const removeProctor = async (req, res) => {
    try {
        const { examId, proctorId } = req.params;

        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({ message: "Exam not found" });
        }

        exam.assignedProctors = exam.assignedProctors.filter(
            p => p.toString() !== proctorId
        );
        exam.updatedAt = Date.now();
        await exam.save();

        res.status(200).json({ message: "Proctor removed successfully", exam });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getProctorExams = async (req, res) => {
    try {
        const proctorId = req.user.userId;
        const { status, page = 1, limit = 10 } = req.query;

        const query = {
            assignedProctors: proctorId,
            isProctored: true
        };

        if (status) query.status = status;

        const exams = await Exam.find(query)
            .populate('createdBy', 'firstName lastName')
            .populate('assignedProctors', 'firstName lastName email')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ scheduledDate: -1 });

        const total = await Exam.countDocuments(query);

        res.status(200).json({
            exams,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getAvailableProctors = async (req, res) => {
    try {
        const proctors = await User.find({
            role: { $in: ['proctor', 'admin'] }
        }).select('firstName lastName email role');

        res.status(200).json(proctors);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

