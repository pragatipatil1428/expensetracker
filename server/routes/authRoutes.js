import { Router } from 'express';
import { register, login, me } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import {
  validate,
  required,
  minLength,
  isEmail,
} from '../middleware/validate.js';

const router = Router();

router.post(
  '/register',
  validate({
    name: [required('Name is required')],
    email: [required('Email is required'), isEmail('Please provide a valid email')],
    password: [
      required('Password is required'),
      minLength(6, 'Password must be at least 6 characters'),
    ],
  }),
  register
);

router.post(
  '/login',
  validate({
    email: [required('Email is required')],
    password: [required('Password is required')],
  }),
  login
);

router.get('/me', protect, me);

export default router;
