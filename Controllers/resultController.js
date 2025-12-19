import Result from "../Models/resultModel.js";
import Exam from "../Models/examModel.js";
import Question from "../Models/questionModel.js";

export const getStudentResults = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 10 } = req.query;

        const results = await Result.find({ student: userId })
            .populate('exam', 'title category scheduledDate duration')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ submittedAt: -1 });

        const total = await Result.countDocuments({ student: userId });

        res.status(200).json({
            results,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getResultById = async (req, res) => {
    try {
        const { resultId } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;

        const result = await Result.findById(resultId)
            .populate('exam')
            .populate('student', 'firstName lastName email')
            .populate('answers.question');

        if (!result) {
            return res.status(404).json({ message: "Result not found" });
        }

        if (userRole === 'student' && result.student._id.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getExamResults = async (req, res) => {
    try {
        const { examId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const results = await Result.find({ exam: examId })
            .populate('student', 'firstName lastName email')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ obtainedMarks: -1 });

        const total = await Result.countDocuments({ exam: examId });

        res.status(200).json({
            results,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getExamAnalytics = async (req, res) => {
    try {
        const { examId } = req.params;

        const results = await Result.find({ 
            exam: examId,
            status: { $in: ['submitted', 'evaluated'] }
        }).populate('answers.question');

        if (results.length === 0) {
            return res.status(200).json({
                message: "No results available for this exam",
                analytics: null
            });
        }

        const scores = results.map(r => r.obtainedMarks);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);
        const passCount = results.filter(r => r.isPassed).length;
        const passPercentage = (passCount / results.length) * 100;

        const questionAnalytics = {};
        for (const result of results) {
            for (const answer of result.answers) {
                const qId = answer.question._id.toString();
                if (!questionAnalytics[qId]) {
                    questionAnalytics[qId] = {
                        questionId: qId,
                        questionText: answer.question.questionText,
                        totalAttempts: 0,
                        correctAttempts: 0,
                        avgTime: 0,
                        totalTime: 0
                    };
                }
                questionAnalytics[qId].totalAttempts++;
                if (answer.isCorrect) questionAnalytics[qId].correctAttempts++;
                questionAnalytics[qId].totalTime += answer.timeTaken || 0;
            }
        }

        const questionStats = Object.values(questionAnalytics).map(q => ({
            ...q,
            accuracy: ((q.correctAttempts / q.totalAttempts) * 100).toFixed(2),
            avgTime: (q.totalTime / q.totalAttempts).toFixed(2)
        }));

        const scoreDistribution = {
            '0-20': 0,
            '21-40': 0,
            '41-60': 0,
            '61-80': 0,
            '81-100': 0
        };

        for (const result of results) {
            const percentage = result.percentage;
            if (percentage <= 20) scoreDistribution['0-20']++;
            else if (percentage <= 40) scoreDistribution['21-40']++;
            else if (percentage <= 60) scoreDistribution['41-60']++;
            else if (percentage <= 80) scoreDistribution['61-80']++;
            else scoreDistribution['81-100']++;
        }

        res.status(200).json({
            totalAttempts: results.length,
            avgScore: avgScore.toFixed(2),
            maxScore,
            minScore,
            passCount,
            failCount: results.length - passCount,
            passPercentage: passPercentage.toFixed(2),
            scoreDistribution,
            questionStats
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getStudentAnalytics = async (req, res) => {
    try {
        const userId = req.params.studentId || req.user.userId;

        const results = await Result.find({
            student: userId,
            status: { $in: ['submitted', 'evaluated'] }
        }).populate('exam', 'title category');

        if (results.length === 0) {
            return res.status(200).json({
                message: "No results available",
                analytics: null
            });
        }

        const totalExams = results.length;
        const passedExams = results.filter(r => r.isPassed).length;
        const avgPercentage = results.reduce((a, r) => a + r.percentage, 0) / totalExams;
        const avgTime = results.reduce((a, r) => a + r.timeTaken, 0) / totalExams;

        const categoryPerformance = {};
        for (const result of results) {
            const category = result.exam.category;
            if (!categoryPerformance[category]) {
                categoryPerformance[category] = {
                    total: 0,
                    passed: 0,
                    totalPercentage: 0
                };
            }
            categoryPerformance[category].total++;
            if (result.isPassed) categoryPerformance[category].passed++;
            categoryPerformance[category].totalPercentage += result.percentage;
        }

        const categoryStats = Object.entries(categoryPerformance).map(([category, data]) => ({
            category,
            examsTaken: data.total,
            examsPassed: data.passed,
            avgPercentage: (data.totalPercentage / data.total).toFixed(2)
        }));

        const recentResults = results
            .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
            .slice(0, 5)
            .map(r => ({
                examTitle: r.exam.title,
                percentage: r.percentage.toFixed(2),
                isPassed: r.isPassed,
                submittedAt: r.submittedAt
            }));

        res.status(200).json({
            totalExams,
            passedExams,
            failedExams: totalExams - passedExams,
            avgPercentage: avgPercentage.toFixed(2),
            avgTimeMinutes: (avgTime / 60).toFixed(2),
            categoryStats,
            recentResults
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const addFeedback = async (req, res) => {
    try {
        const { resultId } = req.params;
        const { feedback } = req.body;

        const result = await Result.findByIdAndUpdate(
            resultId,
            { 
                feedback,
                reviewedBy: req.user.userId
            },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ message: "Result not found" });
        }

        res.status(200).json({ message: "Feedback added successfully", result });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getDashboardStats = async (req, res) => {
    try {
        const totalResults = await Result.countDocuments({ status: { $in: ['submitted', 'evaluated'] } });
        const passedResults = await Result.countDocuments({ isPassed: true, status: { $in: ['submitted', 'evaluated'] } });
        
        const avgScoreResult = await Result.aggregate([
            { $match: { status: { $in: ['submitted', 'evaluated'] } } },
            { $group: { _id: null, avgScore: { $avg: "$percentage" } } }
        ]);

        const recentResults = await Result.find({ status: { $in: ['submitted', 'evaluated'] } })
            .populate('exam', 'title')
            .populate('student', 'firstName lastName')
            .sort({ submittedAt: -1 })
            .limit(10);

        const monthlyTrend = await Result.aggregate([
            { $match: { status: { $in: ['submitted', 'evaluated'] } } },
            {
                $group: {
                    _id: {
                        month: { $month: "$submittedAt" },
                        year: { $year: "$submittedAt" }
                    },
                    count: { $sum: 1 },
                    avgScore: { $avg: "$percentage" }
                }
            },
            { $sort: { "_id.year": -1, "_id.month": -1 } },
            { $limit: 6 }
        ]);

        res.status(200).json({
            totalResults,
            passedResults,
            failedResults: totalResults - passedResults,
            avgScore: avgScoreResult[0]?.avgScore?.toFixed(2) || 0,
            passPercentage: totalResults > 0 ? ((passedResults / totalResults) * 100).toFixed(2) : 0,
            recentResults,
            monthlyTrend
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

