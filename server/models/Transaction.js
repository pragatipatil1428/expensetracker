import mongoose from 'mongoose';

export const TYPES = ['income', 'expense'];

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

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [120, 'Description must be under 120 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    type: {
      type: String,
      enum: TYPES,
      required: [true, 'Type is required'],
      index: true,
    },
    category: {
      type: String,
      enum: CATEGORIES,
      required: [true, 'Category is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: 'Other',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes must be under 500 characters'],
      default: '',
    },
  },
  { timestamps: true }
);

// Compound index for the most common query pattern: a user's transactions by date.
transactionSchema.index({ userId: 1, date: -1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
