import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendPasswordResetEmail = async (email, token) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset - Online Assessment Platform',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1e40af;">Password Reset Request</h2>
                <p>You have requested to reset your password.</p>
                <p>Please click the button below to reset your password:</p>
                <a href="${resetUrl}" 
                   style="display: inline-block; padding: 12px 24px; background-color: #1e40af; 
                          color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                    Reset Password
                </a>
                <p>Or copy and paste this link in your browser:</p>
                <p style="color: #6b7280;">${resetUrl}</p>
                <p>This link will expire in 1 hour.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="color: #9ca3af; font-size: 12px;">
                    If you didn't request a password reset, please ignore this email.
                </p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};

export const sendExamReminderEmail = async (email, examDetails) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Exam Reminder: ${examDetails.title} - Online Assessment Platform`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1e40af;">Exam Reminder</h2>
                <p>This is a reminder for your upcoming exam:</p>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0;">${examDetails.title}</h3>
                    <p style="margin: 5px 0;"><strong>Date:</strong> ${examDetails.date}</p>
                    <p style="margin: 5px 0;"><strong>Time:</strong> ${examDetails.startTime} - ${examDetails.endTime}</p>
                    <p style="margin: 5px 0;"><strong>Duration:</strong> ${examDetails.duration} minutes</p>
                </div>
                <p>Please ensure you:</p>
                <ul>
                    <li>Have a stable internet connection</li>
                    <li>Use a compatible browser (Chrome recommended)</li>
                    <li>Are in a quiet environment</li>
                    <li>Have your ID ready for verification (if required)</li>
                </ul>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="color: #9ca3af; font-size: 12px;">
                    Good luck with your exam!
                </p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};

export const sendResultEmail = async (email, resultDetails) => {
    const statusColor = resultDetails.isPassed ? '#10b981' : '#ef4444';
    const statusText = resultDetails.isPassed ? 'PASSED' : 'FAILED';

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Exam Results: ${resultDetails.examTitle} - Online Assessment Platform`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1e40af;">Exam Results</h2>
                <p>Your results for ${resultDetails.examTitle} are now available:</p>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin: 0 0 15px 0; color: ${statusColor};">${statusText}</h3>
                    <p style="margin: 5px 0;"><strong>Score:</strong> ${resultDetails.obtainedMarks}/${resultDetails.totalMarks}</p>
                    <p style="margin: 5px 0;"><strong>Percentage:</strong> ${resultDetails.percentage}%</p>
                    <p style="margin: 5px 0;"><strong>Correct Answers:</strong> ${resultDetails.correctAnswers}</p>
                    <p style="margin: 5px 0;"><strong>Wrong Answers:</strong> ${resultDetails.wrongAnswers}</p>
                </div>
                <p>Log in to your account to view detailed results and analysis.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="color: #9ca3af; font-size: 12px;">
                    Online Assessment Platform
                </p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};
