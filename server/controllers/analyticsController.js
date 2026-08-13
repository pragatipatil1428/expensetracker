import {
  getSummary,
  getTrend,
  getMonthlyByRange,
  getCategories,
  getRange,
} from '../services/analyticsService.js';
import { catchAsync } from '../utils/catchAsync.js';

// GET /api/analytics/summary?range=thisMonth|lastMonth|last3Months|thisYear|all
export const summary = catchAsync(async (req, res) => {
  const range = req.query.range || 'thisMonth';
  res.json({ summary: await getSummary(req.user._id, range) });
});

// GET /api/analytics/monthly?months=6  OR  ?range=thisYear
export const monthly = catchAsync(async (req, res) => {
  const { range, months } = req.query;
  let data;
  if (range) {
    data = await getMonthlyByRange(req.user._id, range);
  } else {
    const n = Math.min(Math.max(Number(months) || 6, 1), 24);
    data = await getTrend(req.user._id, n);
  }
  res.json({ months: data });
});

// GET /api/analytics/categories?range=thisMonth|lastMonth|last3Months|thisYear|all
export const categories = catchAsync(async (req, res) => {
  const range = getRange(req.query.range || 'all');
  res.json(await getCategories(req.user._id, range));
});
