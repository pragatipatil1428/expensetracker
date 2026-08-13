import { Transaction } from '../models/Transaction.js';

// ── Range helpers ─────────────────────────────────────────────────────────

export function getRange(range, now = new Date()) {
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const ranges = {
    thisMonth: {
      from: thisMonthStart,
      to: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      monthCount: 1,
    },
    lastMonth: {
      from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      to: thisMonthStart,
      monthCount: 1,
    },
    last3Months: {
      from: new Date(now.getFullYear(), now.getMonth() - 2, 1),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      monthCount: 3,
    },
    thisYear: {
      from: new Date(now.getFullYear(), 0, 1),
      to: new Date(now.getFullYear() + 1, 0, 1),
      monthCount: 12,
    },
    all: { from: null, to: null, monthCount: null },
  };
  return ranges[range] || ranges.thisMonth;
}

function previousRange(range, now = new Date()) {
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const ranges = {
    thisMonth: {
      from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      to: thisMonthStart,
    },
    lastMonth: {
      from: new Date(now.getFullYear(), now.getMonth() - 2, 1),
      to: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    },
    last3Months: {
      from: new Date(now.getFullYear(), now.getMonth() - 5, 1),
      to: new Date(now.getFullYear(), now.getMonth() - 2, 1),
    },
    thisYear: {
      from: new Date(now.getFullYear() - 1, 0, 1),
      to: new Date(now.getFullYear(), 0, 1),
    },
    all: { from: null, to: null },
  };
  return ranges[range] || ranges.thisMonth;
}

// ── Aggregations ──────────────────────────────────────────────────────────

async function totalsFor(userId, from, to) {
  const match = { userId };
  if (from || to) {
    match.date = {};
    if (from) match.date.$gte = from;
    if (to) match.date.$lt = to;
  }
  const rows = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        income: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
        expenses: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
        count: { $sum: 1 },
      },
    },
  ]);
  const r = rows[0] || { income: 0, expenses: 0, count: 0 };
  return { income: r.income || 0, expenses: r.expenses || 0, count: r.count || 0 };
}

function pctChange(current, previous) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 100);
}

export async function getSummary(userId, range = 'thisMonth') {
  const { from, to } = getRange(range);
  const prev = previousRange(range);

  const [current, previous, topCategoryRows, largestExpenseRows] =
    await Promise.all([
      totalsFor(userId, from, to),
      totalsFor(userId, prev.from, prev.to),
      Transaction.aggregate([
        { $match: { userId, type: 'expense', ...(from ? { date: { $gte: from } } : {}), ...(to ? { date: { $lt: to } } : {}) } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
        { $limit: 1 },
      ]),
      Transaction.aggregate([
        { $match: { userId, type: 'expense', ...(from ? { date: { $gte: from } } : {}), ...(to ? { date: { $lt: to } } : {}) } },
        { $sort: { amount: -1 } },
        { $limit: 1 },
        { $project: { description: 1, amount: 1, category: 1 } },
      ]),
    ]);

  const allTime = await totalsFor(userId, null, null);

  return {
    range,
    period: { from, to },
    totals: {
      income: current.income,
      expenses: current.expenses,
      savings: current.income - current.expenses,
      transactions: current.count,
    },
    allTime: {
      income: allTime.income,
      expenses: allTime.expenses,
      balance: allTime.income - allTime.expenses,
    },
    changes: {
      income: pctChange(current.income, previous.income),
      expenses: pctChange(current.expenses, previous.expenses),
      savings: pctChange(current.income - current.expenses, previous.income - previous.expenses),
    },
    topCategory: topCategoryRows[0]
      ? { category: topCategoryRows[0]._id, total: topCategoryRows[0].total }
      : null,
    largestExpense: largestExpenseRows[0] || null,
  };
}

export async function getTrend(userId, months = 6) {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return buildMonthlySeries(userId, from, to);
}

export async function getMonthlyByRange(userId, range) {
  const { from, to, monthCount } = getRange(range);
  // For 1-month ranges include the previous month so charts have context.
  const start =
    monthCount <= 1
      ? new Date(from.getFullYear(), from.getMonth() - 1, 1)
      : from;
  return buildMonthlySeries(userId, start, to);
}

async function buildMonthlySeries(userId, from, to) {
  const rows = await Transaction.aggregate([
    { $match: { userId, date: { $gte: from, $lt: to } } },
    {
      $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' },
        total: { $sum: '$amount' },
      },
    },
  ]);

  const result = [];
  for (
    let d = new Date(from.getFullYear(), from.getMonth(), 1);
    d < to;
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  ) {
    result.push({
      month: d.toLocaleString('en', { month: 'short' }),
      year: d.getFullYear(),
      income: 0,
      expenses: 0,
    });
  }

  const index = new Map(result.map((r, i) => [`${r.month}-${r.year}`, i]));
  for (const row of rows) {
    const label = new Date(row._id.year, row._id.month - 1, 1).toLocaleString('en', {
      month: 'short',
    });
    const i = index.get(`${label}-${row._id.year}`);
    if (i !== undefined) {
      if (row._id.type === 'income') result[i].income = row.total;
      else result[i].expenses = row.total;
    }
  }
  return result;
}

export async function getCategories(userId, { from, to } = {}) {
  const match = { userId, type: 'expense' };
  if (from) match.date = { ...(match.date || {}), $gte: from };
  if (to) match.date = { ...(match.date || {}), $lt: to };

  const rows = await Transaction.aggregate([
    { $match: match },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
  ]);

  const total = rows.reduce((sum, r) => sum + r.total, 0);
  return {
    total,
    categories: rows.map((r) => ({
      category: r._id,
      total: r.total,
      percentage: total ? Math.round((r.total / total) * 100) : 0,
    })),
  };
}
