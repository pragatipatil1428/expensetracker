import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
} from '../controllers/userController.js';
import { validate, required, minLength, isEmail } from '../middleware/validate.js';

const router = Router();

router.get('/profile', getProfile);
router.put(
  '/profile',
  validate(
    {
      name: [minLength(1, 'Name cannot be empty')],
      email: [isEmail('Please provide a valid email')],
    },
    { partial: true }
  ),
  updateProfile
);
router.put(
  '/password',
  validate({
    currentPassword: [required('Current password is required')],
    newPassword: [
      required('New password is required'),
      minLength(6, 'New password must be at least 6 characters'),
    ],
  }),
  changePassword
);
router.delete('/account', deleteAccount);

export default router;
