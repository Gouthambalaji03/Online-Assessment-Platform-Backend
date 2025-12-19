import express from 'express';
import {
    register,
    verifyEmail,
    login,
    forgotPassword,
    resetPassword,
    getProfile,
    updateProfile,
    changePassword,
    getAllUsers,
    updateUserRole,
    deleteUser
} from '../Controllers/authController.js';
import { authenticate, isAdmin } from '../Middleware/Middleware.js';

const router = express.Router();

router.post('/register', register);
router.get('/verify/:token', verifyEmail);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

router.get('/users', authenticate, isAdmin, getAllUsers);
router.put('/users/:userId/role', authenticate, isAdmin, updateUserRole);
router.delete('/users/:userId', authenticate, isAdmin, deleteUser);

export default router;
