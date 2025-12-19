import mongoose from "mongoose";

const examSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    instructions: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        required: true
    },
    questions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
    }],
    totalMarks: {
        type: Number,
        default: 0
    },
    passingMarks: {
        type: Number,
        default: 0
    },
    duration: {
        type: Number,
        required: true
    },
    perQuestionTime: {
        type: Number,
        default: null
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    isProctored: {
        type: Boolean,
        default: false
    },
    proctoringSettings: {
        videoMonitoring: {
            type: Boolean,
            default: false
        },
        browserLockdown: {
            type: Boolean,
            default: true
        },
        identityVerification: {
            type: Boolean,
            default: false
        },
        tabSwitchLimit: {
            type: Number,
            default: 3
        }
    },
    shuffleQuestions: {
        type: Boolean,
        default: false
    },
    shuffleOptions: {
        type: Boolean,
        default: false
    },
    showResultImmediately: {
        type: Boolean,
        default: true
    },
    allowReview: {
        type: Boolean,
        default: true
    },
    maxAttempts: {
        type: Number,
        default: 1
    },
    enrolledStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'active', 'completed', 'cancelled'],
        default: 'draft'
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

const Exam = mongoose.model("Exam", examSchema);

export default Exam;

