import { formatDate } from './format.js';

const HEADERS = ['Date', 'Description', 'Type', 'Category', 'Amount', 'Payment Method', 'Notes'];

const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

/**
 * Generates and downloads a CSV file from the given transactions.
 * @param {Array} transactions
 */
export function exportTransactionsToCSV(transactions) {
  if (!transactions.length) return;

  const rows = transactions.map((t) => [
    formatDate(t.date),
    t.description,
    t.type,
    t.category,
    t.amount,
    t.paymentMethod,
    t.notes || '',
  ]);

  const csv = [HEADERS, ...rows]
    .map((row) => row.map(escape).join(','))
    .join('\n');

  // Prepend a BOM so Excel opens the file with correct encoding.
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
