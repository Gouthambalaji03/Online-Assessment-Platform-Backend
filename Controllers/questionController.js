import Question from "../Models/questionModel.js";

export const createQuestion = async (req, res) => {
    try {
        const questionData = {
            ...req.body,
            createdBy: req.user.userId
        };

        const question = new Question(questionData);
        await question.save();

        res.status(201).json({ message: "Question created successfully", question });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const createBulkQuestions = async (req, res) => {
    try {
        const { questions } = req.body;

        const questionsWithCreator = questions.map(q => ({
            ...q,
            createdBy: req.user.userId
        }));

        const createdQuestions = await Question.insertMany(questionsWithCreator);

        res.status(201).json({ 
            message: `${createdQuestions.length} questions created successfully`, 
            questions: createdQuestions 
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getAllQuestions = async (req, res) => {
    try {
        const { 
            category, 
            topic, 
            difficultyLevel, 
            questionType,
            page = 1, 
            limit = 20,
            search
        } = req.query;

        const query = { isActive: true };

        if (category) query.category = category;
        if (topic) query.topic = topic;
        if (difficultyLevel) query.difficultyLevel = difficultyLevel;
        if (questionType) query.questionType = questionType;
        if (search) {
            query.questionText = { $regex: search, $options: 'i' };
        }

        const questions = await Question.find(query)
            .populate('createdBy', 'firstName lastName')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Question.countDocuments(query);

        res.status(200).json({
            questions,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getQuestionById = async (req, res) => {
    try {
        const { questionId } = req.params;

        const question = await Question.findById(questionId)
            .populate('createdBy', 'firstName lastName');

        if (!question) {
            return res.status(404).json({ message: "Question not found" });
        }

        res.status(200).json(question);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;

        const question = await Question.findByIdAndUpdate(
            questionId,
            { ...req.body, updatedAt: Date.now() },
            { new: true }
        );

        if (!question) {
            return res.status(404).json({ message: "Question not found" });
        }

        res.status(200).json({ message: "Question updated successfully", question });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const deleteQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;

        const question = await Question.findByIdAndUpdate(
            questionId,
            { isActive: false },
            { new: true }
        );

        if (!question) {
            return res.status(404).json({ message: "Question not found" });
        }

        res.status(200).json({ message: "Question deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getCategories = async (req, res) => {
    try {
        const categories = await Question.distinct('category', { isActive: true });
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getTopics = async (req, res) => {
    try {
        const { category } = req.query;
        const query = { isActive: true };
        if (category) query.category = category;

        const topics = await Question.distinct('topic', query);
        res.status(200).json(topics);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getQuestionStats = async (req, res) => {
    try {
        const stats = await Question.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: null,
                    totalQuestions: { $sum: 1 },
                    byType: {
                        $push: "$questionType"
                    },
                    byDifficulty: {
                        $push: "$difficultyLevel"
                    }
                }
            }
        ]);

        const categoryStats = await Question.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            }
        ]);

        const difficultyStats = await Question.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: "$difficultyLevel",
                    count: { $sum: 1 }
                }
            }
        ]);

        const typeStats = await Question.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: "$questionType",
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            totalQuestions: stats[0]?.totalQuestions || 0,
            categoryStats,
            difficultyStats,
            typeStats
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

