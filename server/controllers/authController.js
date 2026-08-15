import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { signToken } from '../utils/token.js';

export const register = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;

  // Include soft-deleted accounts: their email stays reserved in the DB,
  // so a duplicate-key error would otherwise surface as a 500 on create.
  const existing = await User.collection.findOne({
    email: String(email).trim().toLowerCase(),
  });
  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }

  const user = await User.create({ name, email, password });
  res.status(201).json({
    message: 'Account created successfully',
    user: user.toSafeJSON(),
  });
});

export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  res.json({
    message: 'Logged in successfully',
    token: signToken(user._id),
    user: user.toSafeJSON(),
  });
});

export const me = catchAsync(async (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});
