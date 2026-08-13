import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';

// Requires a valid `Authorization: Bearer <token>` header and attaches
// the authenticated user to `req.user`.
export const protect = catchAsync(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    throw new AppError('Not authorized — please log in', 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError('Not authorized — invalid or expired token', 401);
  }

  const user = await User.findById(decoded.id).select('-password');
  if (!user) {
    throw new AppError('Not authorized — user no longer exists', 401);
  }

  req.user = user;
  next();
});
