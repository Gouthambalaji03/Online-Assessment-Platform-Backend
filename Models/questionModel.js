import mongoose from "mongoose";

const questionSchema = mongoose.Schema({
    questionText: {
        type: String,
        required: true
    },
    questionType: {
        type: String,
        enum: ['mcq', 'true_false', 'short_answer'],
        required: true
    },
    options: [{
        optionText: String,
        isCorrect: Boolean
    }],
    correctAnswer: {
        type: String
    },
    category: {
        type: String,
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    difficultyLevel: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    marks: {
        type: Number,
        default: 1
    },
    negativeMarks: {
        type: Number,
        default: 0
    },
    explanation: {
        type: String,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const Question = mongoose.model("Question", questionSchema);

export default Question;

