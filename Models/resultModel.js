import mongoose from "mongoose";

const answerSchema = mongoose.Schema({
    question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true
    },
    selectedOption: {
        type: String,
        default: null
    },
    isCorrect: {
        type: Boolean,
        default: false
    },
    marksObtained: {
        type: Number,
        default: 0
    },
    timeTaken: {
        type: Number,
        default: 0
    }
});

const resultSchema = mongoose.Schema({
    exam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    answers: [answerSchema],
    totalMarks: {
        type: Number,
        default: 0
    },
    obtainedMarks: {
        type: Number,
        default: 0
    },
    percentage: {
        type: Number,
        default: 0
    },
    isPassed: {
        type: Boolean,
        default: false
    },
    correctAnswers: {
        type: Number,
        default: 0
    },
    wrongAnswers: {
        type: Number,
        default: 0
    },
    unanswered: {
        type: Number,
        default: 0
    },
    timeTaken: {
        type: Number,
        default: 0
    },
    startedAt: {
        type: Date
    },
    submittedAt: {
        type: Date
    },
    status: {
        type: String,
        enum: ['in_progress', 'submitted', 'evaluated', 'flagged'],
        default: 'in_progress'
    },
    attemptNumber: {
        type: Number,
        default: 1
    },
    proctoringFlags: [{
        type: {
            type: String
        },
        timestamp: Date,
        description: String
    }],
    feedback: {
        type: String,
        default: ''
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Result = mongoose.model("Result", resultSchema);

export default Result;

