import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';

export const getProfile = catchAsync(async (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

export const updateProfile = catchAsync(async (req, res) => {
  const { name, email } = req.body;
  if (!name && !email) {
    throw new AppError('Provide a name or email to update', 400);
  }

  if (req.user.isDemo) {
    throw new AppError('The demo account profile cannot be changed', 403);
  }

  if (email && email !== req.user.email) {
    // Include soft-deleted accounts — their email stays reserved in the DB.
    const existing = await User.collection.findOne({
      email: String(email).trim().toLowerCase(),
    });
    if (existing) throw new AppError('This email is already in use', 409);
  }

  if (name) req.user.name = String(name).trim();
  if (email) req.user.email = String(email).trim().toLowerCase();
  await req.user.save();

  res.json({ message: 'Profile updated', user: req.user.toSafeJSON() });
});

export const changePassword = catchAsync(async (req, res) => {
  if (req.user.isDemo) {
    throw new AppError('The demo account password cannot be changed', 403);
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new AppError('Both current and new password are required', 400);
  }
  if (String(newPassword).length < 6) {
    throw new AppError('New password must be at least 6 characters', 400);
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 400);
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: 'Password changed successfully' });
});

export const deleteAccount = catchAsync(async (req, res) => {
  if (req.user.isDemo) {
    throw new AppError('The demo account cannot be deleted', 403);
  }

  // Soft delete: mark the account and all its transactions as deleted so
  // nothing is physically removed, but the user can no longer log in.
  await Transaction.updateMany({ userId: req.user._id }, { isDeleted: true });
  await User.findByIdAndUpdate(req.user._id, { isDeleted: true });
  res.json({ message: 'Account deleted' });
});
