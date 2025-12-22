import User from "../Models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendPasswordResetEmail, sendVerificationEmail } from "../Utils/mailer.js";

export const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, role, secretCode } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists with this email" });
        }

        if (role === 'admin') {
            if (secretCode !== process.env.ADMIN_SECRET_CODE) {
                return res.status(403).json({ message: "Invalid admin registration code" });
            }
        }

        if (role === 'proctor') {
            if (secretCode !== process.env.PROCTOR_SECRET_CODE) {
                return res.status(403).json({ message: "Invalid proctor registration code" });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const verificationToken = crypto.randomBytes(32).toString('hex');

        const newUser = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role: role || 'student',
            isVerified: false,
            verificationToken,
            verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        });

        await newUser.save();

        // Send verification email
        try {
            await sendVerificationEmail(email, verificationToken, firstName);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
        }

        res.status(201).json({
            message: "Registration successful! Please check your email to verify your account.",
            userId: newUser._id
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        if (role && user.role !== role) {
            return res.status(403).json({ 
                message: `This account is not registered as ${role}. Please use the correct login tab.`,
                actualRole: user.role
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                message: "Please verify your email before logging in. Check your inbox for the verification link.",
                needsVerification: true,
                email: user.email
            });
        }

        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        // First check if token exists at all (regardless of expiry)
        const userWithToken = await User.findOne({ verificationToken: token });

        if (!userWithToken) {
            // Check if there's a user who was already verified (token cleared)
            console.log(`Verification failed: Token not found in database`);
            return res.status(400).json({
                message: "Invalid verification token. The link may have already been used or is incorrect."
            });
        }

        // Check if token is expired
        if (userWithToken.verificationTokenExpires < Date.now()) {
            console.log(`Verification failed: Token expired for user ${userWithToken.email}`);
            return res.status(400).json({
                message: "Verification token has expired. Please request a new verification email."
            });
        }

        // Check if already verified
        if (userWithToken.isVerified) {
            return res.status(400).json({
                message: "Email is already verified. You can login now."
            });
        }

        userWithToken.isVerified = true;
        userWithToken.verificationToken = undefined;
        userWithToken.verificationTokenExpires = undefined;
        await userWithToken.save();

        console.log(`Email verified successfully for user: ${userWithToken.email}`);
        res.status(200).json({ message: "Email verified successfully! You can now login." });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "Email is already verified" });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.verificationToken = verificationToken;
        user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
        await user.save();

        await sendVerificationEmail(email, verificationToken, user.firstName);

        res.status(200).json({ message: "Verification email sent successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found with this email" });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();

        await sendPasswordResetEmail(email, resetToken);

        res.status(200).json({ message: "Password reset link sent to your email" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired reset token" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, phone, profilePicture } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { firstName, lastName, phone, profilePicture },
            { new: true }
        ).select('-password');

        res.status(200).json({ message: "Profile updated successfully", user });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const { role, page = 1, limit = 10 } = req.query;
        const query = role ? { role } : {};

        const users = await User.find(query)
            .select('-password')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(query);

        res.status(200).json({
            users,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        const user = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User role updated successfully", user });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
