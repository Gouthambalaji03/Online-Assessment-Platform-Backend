import Result from "../Models/resultModel.js";
import Exam from "../Models/examModel.js";
import Question from "../Models/questionModel.js";
import User from "../Models/userModel.js";

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

export const getPendingGrading = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        // Find results that have short_answer questions needing manual grading
        const results = await Result.find({
            status: 'submitted'
        })
            .populate('exam', 'title category scheduledDate')
            .populate('student', 'firstName lastName email')
            .populate('answers.question')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ submittedAt: -1 });

        // Filter to only results that have unevaluated short answer questions
        const pendingResults = results.filter(result => {
            return result.answers.some(answer =>
                answer.question?.questionType === 'short_answer' &&
                answer.selectedOption &&
                answer.marksObtained === 0 &&
                !answer.isCorrect
            );
        });

        const total = pendingResults.length;

        res.status(200).json({
            results: pendingResults,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const gradeShortAnswer = async (req, res) => {
    try {
        const { resultId, answerId } = req.params;
        const { marks, isCorrect, feedback } = req.body;

        const result = await Result.findById(resultId).populate('answers.question');
        if (!result) {
            return res.status(404).json({ message: "Result not found" });
        }

        const answerIndex = result.answers.findIndex(
            a => a._id.toString() === answerId
        );

        if (answerIndex === -1) {
            return res.status(404).json({ message: "Answer not found" });
        }

        const answer = result.answers[answerIndex];
        const question = answer.question;

        // Validate marks
        if (marks > question.marks) {
            return res.status(400).json({
                message: `Marks cannot exceed maximum (${question.marks})`
            });
        }

        // Update the answer
        result.answers[answerIndex].isCorrect = isCorrect;
        result.answers[answerIndex].marksObtained = marks;

        // Recalculate result totals
        let obtainedMarks = 0;
        let correctAnswers = 0;
        let wrongAnswers = 0;
        let unanswered = 0;

        for (const ans of result.answers) {
            if (!ans.selectedOption) {
                unanswered++;
            } else if (ans.isCorrect) {
                correctAnswers++;
                obtainedMarks += ans.marksObtained;
            } else {
                wrongAnswers++;
                obtainedMarks += ans.marksObtained; // Could be partial marks
            }
        }

        result.obtainedMarks = Math.max(0, obtainedMarks);
        result.percentage = (result.obtainedMarks / result.totalMarks) * 100;
        result.correctAnswers = correctAnswers;
        result.wrongAnswers = wrongAnswers;
        result.unanswered = unanswered;

        // Get passing marks from exam
        const exam = await Exam.findById(result.exam);
        result.isPassed = result.obtainedMarks >= exam.passingMarks;

        // Check if all short answers are graded
        const hasUngradedShortAnswers = result.answers.some(ans =>
            ans.question?.questionType === 'short_answer' &&
            ans.selectedOption &&
            ans.marksObtained === 0 &&
            !ans.isCorrect
        );

        if (!hasUngradedShortAnswers) {
            result.status = 'evaluated';
        }

        result.reviewedBy = req.user.userId;
        if (feedback) {
            result.feedback = feedback;
        }

        await result.save();

        res.status(200).json({
            message: "Answer graded successfully",
            result
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const bulkGradeResult = async (req, res) => {
    try {
        const { resultId } = req.params;
        const { grades, feedback } = req.body;
        // grades: [{ answerId, marks, isCorrect }]

        const result = await Result.findById(resultId).populate('answers.question');
        if (!result) {
            return res.status(404).json({ message: "Result not found" });
        }

        for (const grade of grades) {
            const answerIndex = result.answers.findIndex(
                a => a._id.toString() === grade.answerId
            );

            if (answerIndex !== -1) {
                result.answers[answerIndex].isCorrect = grade.isCorrect;
                result.answers[answerIndex].marksObtained = grade.marks;
            }
        }

        // Recalculate totals
        let obtainedMarks = 0;
        let correctAnswers = 0;
        let wrongAnswers = 0;
        let unanswered = 0;

        for (const ans of result.answers) {
            if (!ans.selectedOption) {
                unanswered++;
            } else if (ans.isCorrect) {
                correctAnswers++;
                obtainedMarks += ans.marksObtained;
            } else {
                wrongAnswers++;
                obtainedMarks += ans.marksObtained;
            }
        }

        result.obtainedMarks = Math.max(0, obtainedMarks);
        result.percentage = (result.obtainedMarks / result.totalMarks) * 100;
        result.correctAnswers = correctAnswers;
        result.wrongAnswers = wrongAnswers;
        result.unanswered = unanswered;

        const exam = await Exam.findById(result.exam);
        result.isPassed = result.obtainedMarks >= exam.passingMarks;
        result.status = 'evaluated';
        result.reviewedBy = req.user.userId;
        if (feedback) {
            result.feedback = feedback;
        }

        await result.save();

        res.status(200).json({
            message: "Result graded successfully",
            result
        });
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

export const exportExamResultsCSV = async (req, res) => {
    try {
        const { examId } = req.params;

        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({ message: "Exam not found" });
        }

        const results = await Result.find({ exam: examId })
            .populate('student', 'firstName lastName email')
            .sort({ obtainedMarks: -1 });

        // Build CSV content
        const headers = [
            'Student Name',
            'Email',
            'Score',
            'Total Marks',
            'Percentage',
            'Status',
            'Correct Answers',
            'Wrong Answers',
            'Unanswered',
            'Time Taken (minutes)',
            'Submitted At'
        ];

        const rows = results.map(r => [
            `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.trim(),
            r.student?.email || '',
            r.obtainedMarks,
            r.totalMarks,
            r.percentage?.toFixed(2) + '%',
            r.isPassed ? 'PASSED' : 'FAILED',
            r.correctAnswers,
            r.wrongAnswers,
            r.unanswered,
            (r.timeTaken / 60).toFixed(2),
            r.submittedAt ? new Date(r.submittedAt).toLocaleString() : ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${exam.title.replace(/[^a-z0-9]/gi, '_')}_results.csv"`);
        res.send(csvContent);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const exportStudentResultsCSV = async (req, res) => {
    try {
        const userId = req.params.studentId || req.user.userId;

        const student = await User.findById(userId).select('firstName lastName email');
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        const results = await Result.find({
            student: userId,
            status: { $in: ['submitted', 'evaluated'] }
        })
            .populate('exam', 'title category')
            .sort({ submittedAt: -1 });

        const headers = [
            'Exam Title',
            'Category',
            'Score',
            'Total Marks',
            'Percentage',
            'Status',
            'Correct',
            'Wrong',
            'Unanswered',
            'Time (min)',
            'Date'
        ];

        const rows = results.map(r => [
            r.exam?.title || '',
            r.exam?.category || '',
            r.obtainedMarks,
            r.totalMarks,
            r.percentage?.toFixed(2) + '%',
            r.isPassed ? 'PASSED' : 'FAILED',
            r.correctAnswers,
            r.wrongAnswers,
            r.unanswered,
            (r.timeTaken / 60).toFixed(2),
            r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const filename = `${student.firstName}_${student.lastName}_results.csv`.replace(/[^a-z0-9_]/gi, '_');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csvContent);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getStudentPerformanceTrends = async (req, res) => {
    try {
        const userId = req.params.studentId || req.user.userId;

        const results = await Result.find({
            student: userId,
            status: { $in: ['submitted', 'evaluated'] }
        })
            .populate('exam', 'title category')
            .sort({ submittedAt: 1 });

        if (results.length === 0) {
            return res.status(200).json({
                message: "No results available",
                trends: null
            });
        }

        // Performance over time
        const performanceOverTime = results.map(r => ({
            date: r.submittedAt,
            examTitle: r.exam?.title,
            percentage: parseFloat(r.percentage?.toFixed(2)),
            isPassed: r.isPassed
        }));

        // Calculate moving average (last 5 exams)
        const movingAverages = [];
        for (let i = 0; i < performanceOverTime.length; i++) {
            const windowStart = Math.max(0, i - 4);
            const window = performanceOverTime.slice(windowStart, i + 1);
            const avg = window.reduce((sum, p) => sum + p.percentage, 0) / window.length;
            movingAverages.push({
                date: performanceOverTime[i].date,
                average: parseFloat(avg.toFixed(2))
            });
        }

        // Performance by category
        const categoryPerformance = {};
        for (const r of results) {
            const cat = r.exam?.category || 'Unknown';
            if (!categoryPerformance[cat]) {
                categoryPerformance[cat] = { total: 0, sum: 0, passed: 0, count: 0 };
            }
            categoryPerformance[cat].count++;
            categoryPerformance[cat].sum += r.percentage;
            if (r.isPassed) categoryPerformance[cat].passed++;
        }

        const categoryStats = Object.entries(categoryPerformance).map(([category, data]) => ({
            category,
            examCount: data.count,
            avgPercentage: parseFloat((data.sum / data.count).toFixed(2)),
            passRate: parseFloat(((data.passed / data.count) * 100).toFixed(2))
        }));

        // Monthly performance
        const monthlyPerformance = {};
        for (const r of results) {
            const date = new Date(r.submittedAt);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!monthlyPerformance[key]) {
                monthlyPerformance[key] = { sum: 0, count: 0, passed: 0 };
            }
            monthlyPerformance[key].sum += r.percentage;
            monthlyPerformance[key].count++;
            if (r.isPassed) monthlyPerformance[key].passed++;
        }

        const monthlyStats = Object.entries(monthlyPerformance)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([month, data]) => ({
                month,
                avgPercentage: parseFloat((data.sum / data.count).toFixed(2)),
                examCount: data.count,
                passRate: parseFloat(((data.passed / data.count) * 100).toFixed(2))
            }));

        // Improvement score (compare first half to second half)
        let improvementScore = 0;
        if (results.length >= 4) {
            const midpoint = Math.floor(results.length / 2);
            const firstHalf = results.slice(0, midpoint);
            const secondHalf = results.slice(midpoint);
            const firstAvg = firstHalf.reduce((sum, r) => sum + r.percentage, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((sum, r) => sum + r.percentage, 0) / secondHalf.length;
            improvementScore = parseFloat((secondAvg - firstAvg).toFixed(2));
        }

        res.status(200).json({
            performanceOverTime,
            movingAverages,
            categoryStats,
            monthlyStats,
            improvementScore,
            totalExams: results.length,
            overallAverage: parseFloat((results.reduce((sum, r) => sum + r.percentage, 0) / results.length).toFixed(2))
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

