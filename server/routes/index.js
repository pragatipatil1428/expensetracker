import { Router } from 'express';
import authRoutes from './authRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import userRoutes from './userRoutes.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/transactions', protect, transactionRoutes);
router.use('/analytics', protect, analyticsRoutes);
router.use('/users', protect, userRoutes);

export default router;
