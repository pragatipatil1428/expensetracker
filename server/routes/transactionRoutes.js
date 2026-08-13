import { Router } from 'express';
import {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transactionController.js';
import {
  validate,
  required,
  positiveNumber,
  isOneOf,
  isDate,
} from '../middleware/validate.js';
import { CATEGORIES, PAYMENT_METHODS, TYPES } from '../models/Transaction.js';

const router = Router();

const transactionRules = {
  description: [required('Description is required')],
  amount: [required('Amount is required'), positiveNumber('Amount must be greater than 0')],
  type: [required('Type is required'), isOneOf(TYPES, 'Type must be income or expense')],
  category: [required('Category is required'), isOneOf(CATEGORIES, 'Invalid category')],
  date: [required('Date is required'), isDate('Please provide a valid date')],
  paymentMethod: [isOneOf(PAYMENT_METHODS, 'Invalid payment method')],
  notes: [],
};

router
  .route('/')
  .get(getTransactions)
  .post(validate(transactionRules), createTransaction);

router
  .route('/:id')
  .get(getTransaction)
  .put(validate(transactionRules, { partial: true }), updateTransaction)
  .delete(deleteTransaction);

export default router;
