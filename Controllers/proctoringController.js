import ProctoringLog from "../Models/proctoringLogModel.js";
import Result from "../Models/resultModel.js";

export const logProctoringEvent = async (req, res) => {
    try {
        const { examId, resultId, eventType, description, severity, screenshot, metadata } = req.body;
        const studentId = req.user.userId;

        const log = new ProctoringLog({
            exam: examId,
            student: studentId,
            result: resultId,
            eventType,
            description,
            severity: severity || 'low',
            screenshot,
            metadata
        });

        await log.save();

        if (resultId) {
            await Result.findByIdAndUpdate(resultId, {
                $push: {
                    proctoringFlags: {
                        type: eventType,
                        timestamp: new Date(),
                        description
                    }
                }
            });
        }

        res.status(201).json({ message: "Event logged successfully", logId: log._id });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getProctoringLogs = async (req, res) => {
    try {
        const { examId, studentId, eventType, severity, page = 1, limit = 20 } = req.query;
        const query = {};

        if (examId) query.exam = examId;
        if (studentId) query.student = studentId;
        if (eventType) query.eventType = eventType;
        if (severity) query.severity = severity;

        const logs = await ProctoringLog.find(query)
            .populate('exam', 'title')
            .populate('student', 'firstName lastName email')
            .populate('result')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ timestamp: -1 });

        const total = await ProctoringLog.countDocuments(query);

        res.status(200).json({
            logs,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getStudentProctoringLogs = async (req, res) => {
    try {
        const { studentId, examId } = req.params;

        const logs = await ProctoringLog.find({
            student: studentId,
            exam: examId
        })
            .populate('exam', 'title')
            .sort({ timestamp: 1 });

        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const reviewProctoringLog = async (req, res) => {
    try {
        const { logId } = req.params;
        const { reviewNotes } = req.body;

        const log = await ProctoringLog.findByIdAndUpdate(
            logId,
            {
                isReviewed: true,
                reviewedBy: req.user.userId,
                reviewNotes
            },
            { new: true }
        );

        if (!log) {
            return res.status(404).json({ message: "Log not found" });
        }

        res.status(200).json({ message: "Log reviewed successfully", log });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getFlaggedExams = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const flaggedResults = await Result.find({
            'proctoringFlags.0': { $exists: true }
        })
            .populate('exam', 'title scheduledDate')
            .populate('student', 'firstName lastName email')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ submittedAt: -1 });

        const total = await Result.countDocuments({
            'proctoringFlags.0': { $exists: true }
        });

        res.status(200).json({
            results: flaggedResults,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getProctoringStats = async (req, res) => {
    try {
        const { examId } = req.query;
        const query = examId ? { exam: examId } : {};

        const totalLogs = await ProctoringLog.countDocuments(query);
        const reviewedLogs = await ProctoringLog.countDocuments({ ...query, isReviewed: true });

        const severityStats = await ProctoringLog.aggregate([
            { $match: query },
            {
                $group: {
                    _id: "$severity",
                    count: { $sum: 1 }
                }
            }
        ]);

        const eventTypeStats = await ProctoringLog.aggregate([
            { $match: query },
            {
                $group: {
                    _id: "$eventType",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const recentLogs = await ProctoringLog.find(query)
            .populate('exam', 'title')
            .populate('student', 'firstName lastName')
            .sort({ timestamp: -1 })
            .limit(10);

        res.status(200).json({
            totalLogs,
            reviewedLogs,
            pendingReview: totalLogs - reviewedLogs,
            severityStats,
            eventTypeStats,
            recentLogs
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const terminateExam = async (req, res) => {
    try {
        const { resultId } = req.params;
        const { reason } = req.body;

        const result = await Result.findById(resultId);
        if (!result) {
            return res.status(404).json({ message: "Result not found" });
        }

        result.status = 'flagged';
        result.proctoringFlags.push({
            type: 'exam_terminated',
            timestamp: new Date(),
            description: reason || 'Exam terminated by proctor'
        });
        await result.save();

        await new ProctoringLog({
            exam: result.exam,
            student: result.student,
            result: resultId,
            eventType: 'exam_terminated',
            description: reason || 'Exam terminated by proctor',
            severity: 'critical'
        }).save();

        res.status(200).json({ message: "Exam terminated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getActiveSessions = async (req, res) => {
    try {
        const { examId } = req.query;
        const query = { status: 'in_progress' };
        if (examId) query.exam = examId;

        const activeSessions = await Result.find(query)
            .populate('exam', 'title duration')
            .populate('student', 'firstName lastName email');

        const sessionsWithLogs = await Promise.all(
            activeSessions.map(async (session) => {
                const recentFlags = await ProctoringLog.find({
                    result: session._id
                })
                    .sort({ timestamp: -1 })
                    .limit(5);

                return {
                    ...session.toObject(),
                    recentFlags,
                    flagCount: session.proctoringFlags.length
                };
            })
        );

        res.status(200).json(sessionsWithLogs);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

