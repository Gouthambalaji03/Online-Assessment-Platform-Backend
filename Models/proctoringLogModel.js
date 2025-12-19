import mongoose from "mongoose";

const proctoringLogSchema = mongoose.Schema({
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
    result: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Result'
    },
    eventType: {
        type: String,
        enum: [
            'tab_switch',
            'window_blur',
            'copy_paste',
            'right_click',
            'fullscreen_exit',
            'face_not_detected',
            'multiple_faces',
            'suspicious_movement',
            'browser_resize',
            'devtools_open',
            'screenshot_attempt',
            'identity_mismatch',
            'network_disconnect',
            'exam_started',
            'exam_submitted',
            'exam_terminated'
        ],
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low'
    },
    screenshot: {
        type: String,
        default: ''
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    isReviewed: {
        type: Boolean,
        default: false
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewNotes: {
        type: String,
        default: ''
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const ProctoringLog = mongoose.model("ProctoringLog", proctoringLogSchema);

export default ProctoringLog;

