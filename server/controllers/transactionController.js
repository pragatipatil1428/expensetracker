import { Transaction } from '../models/Transaction.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';

// GET /api/transactions
// Query params: search, type, category, from, to, sort, limit
export const getTransactions = catchAsync(async (req, res) => {
  const { search, type, category, from, to, sort = 'newest', limit = 500 } =
    req.query;

  const filter = { userId: req.user._id };

  if (type) filter.type = type;
  if (category) filter.category = category;

  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) {
      const endOfDay = new Date(to);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date.$lte = endOfDay;
    }
  }

  if (search && String(search).trim()) {
    const escaped = String(search)
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    filter.$or = [{ description: regex }, { category: regex }];
  }

  const sortMap = {
    newest: { date: -1, createdAt: -1 },
    oldest: { date: 1, createdAt: 1 },
    amount_desc: { amount: -1, date: -1 },
    amount_asc: { amount: 1, date: -1 },
  };

  const transactions = await Transaction.find(filter)
    .sort(sortMap[sort] || sortMap.newest)
    .limit(Math.min(Number(limit) || 500, 1000));

  res.json({ count: transactions.length, transactions });
});

export const getTransaction = catchAsync(async (req, res) => {
  const transaction = await Transaction.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });
  if (!transaction) throw new AppError('Transaction not found', 404);
  res.json({ transaction });
});

export const createTransaction = catchAsync(async (req, res) => {
  const transaction = await Transaction.create({
    ...req.body,
    userId: req.user._id,
  });
  res.status(201).json({ message: 'Transaction created', transaction });
});

export const updateTransaction = catchAsync(async (req, res) => {
  const transaction = await Transaction.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!transaction) throw new AppError('Transaction not found', 404);
  res.json({ message: 'Transaction updated', transaction });
});

export const deleteTransaction = catchAsync(async (req, res) => {
  const transaction = await Transaction.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });
  if (!transaction) throw new AppError('Transaction not found', 404);
  res.json({ message: 'Transaction deleted' });
});
