import { useState } from 'react';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import Textarea from '../ui/Textarea.jsx';
import { CATEGORIES, PAYMENT_METHODS } from '../../utils/constants.js';
import { toDateInputValue } from '../../utils/format.js';

export default function TransactionForm({ initialValues, onSubmit, submitLabel, loading = false }) {
  const [form, setForm] = useState(() => ({
    description: initialValues?.description || '',
    amount: initialValues?.amount ?? '',
    type: initialValues?.type || 'expense',
    category: initialValues?.category || '',
    date: toDateInputValue(initialValues?.date),
    paymentMethod: initialValues?.paymentMethod || 'UPI',
    notes: initialValues?.notes || '',
  }));
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const setType = (type) => {
    setForm((f) => ({ ...f, type }));
    if (errors.type) setErrors((er) => ({ ...er, type: undefined }));
  };

  const validate = () => {
    const er = {};
    if (!form.description.trim()) er.description = 'Description is required';
    const amount = Number(form.amount);
    if (form.amount === '' || form.amount === null) {
      er.amount = 'Amount is required';
    } else if (!Number.isFinite(amount) || amount <= 0) {
      er.amount = 'Amount must be greater than 0';
    }
    if (!form.type) er.type = 'Type is required';
    if (!form.category) er.category = 'Category is required';
    if (!form.date) er.date = 'Date is required';
    return er;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const er = validate();
    if (Object.keys(er).length > 0) {
      setErrors(er);
      return;
    }
    onSubmit({
      description: form.description.trim(),
      amount: Number(form.amount),
      type: form.type,
      category: form.category,
      date: form.date,
      paymentMethod: form.paymentMethod,
      notes: form.notes.trim(),
    });
  };

  return (
    <form className="transaction-form" onSubmit={handleSubmit} noValidate>
      <div className="transaction-form__type-toggle" role="radiogroup" aria-label="Transaction type">
        <button
          type="button"
          className={`type-btn ${form.type === 'expense' ? 'type-btn--active-expense' : ''}`}
          onClick={() => setType('expense')}
        >
          Expense
        </button>
        <button
          type="button"
          className={`type-btn ${form.type === 'income' ? 'type-btn--active-income' : ''}`}
          onClick={() => setType('income')}
        >
          Income
        </button>
      </div>

      <div className="transaction-form__grid">
        <Input
          label="Description"
          name="description"
          value={form.description}
          onChange={set('description')}
          error={errors.description}
          placeholder="e.g. Weekly groceries"
          autoComplete="off"
        />
        <Input
          label="Amount"
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          value={form.amount}
          onChange={set('amount')}
          error={errors.amount}
          placeholder="0.00"
        />
        <Select
          label="Category"
          name="category"
          value={form.category}
          onChange={set('category')}
          error={errors.category}
          placeholder="Select a category"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Input
          label="Date"
          name="date"
          type="date"
          value={form.date}
          onChange={set('date')}
          error={errors.date}
        />
        <Select
          label="Payment Method"
          name="paymentMethod"
          value={form.paymentMethod}
          onChange={set('paymentMethod')}
        >
          {PAYMENT_METHODS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
        <Textarea
          label="Notes (optional)"
          name="notes"
          value={form.notes}
          onChange={set('notes')}
          rows={3}
          placeholder="Anything worth remembering about this transaction"
        />
      </div>

      <div className="transaction-form__actions">
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
