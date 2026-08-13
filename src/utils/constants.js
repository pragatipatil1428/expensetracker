export const CATEGORIES = [
  'Food',
  'Shopping',
  'Travel',
  'Bills',
  'Rent',
  'Entertainment',
  'Health',
  'Education',
  'Salary',
  'Freelance',
  'Other',
];

export const PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Other',
];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'amount_desc', label: 'Highest amount' },
  { value: 'amount_asc', label: 'Lowest amount' },
];

export const RANGE_OPTIONS = [
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'last3Months', label: 'Last 3 Months' },
  { value: 'thisYear', label: 'This Year' },
];

export const RANGE_MONTHS = {
  thisMonth: 1,
  lastMonth: 1,
  last3Months: 3,
  thisYear: 12,
};
