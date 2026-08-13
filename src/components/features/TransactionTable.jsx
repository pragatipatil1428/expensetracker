import { formatCurrency, formatDate } from '../../utils/format.js';
import Badge from '../ui/Badge.jsx';
import Icon from '../ui/Icon.jsx';

export default function TransactionTable({
  transactions,
  onEdit,
  onDelete,
  showActions = true,
  showPayment = true,
}) {
  return (
    <div className="transaction-table-wrap">
      <table className="transaction-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Type</th>
            <th>Amount</th>
            {showPayment && <th>Payment</th>}
            {showActions && <th className="transaction-table__actions-th">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t._id || t.id}>
              <td data-label="Date">{formatDate(t.date)}</td>
              <td data-label="Description">
                <div className="transaction-table__desc">
                  <span className="transaction-table__title">{t.description}</span>
                  {t.notes && (
                    <span className="transaction-table__notes">{t.notes}</span>
                  )}
                </div>
              </td>
              <td data-label="Category">
                <Badge>{t.category}</Badge>
              </td>
              <td data-label="Type">
                <Badge tone={t.type === 'income' ? 'income' : 'expense'}>
                  {t.type}
                </Badge>
              </td>
              <td
                data-label="Amount"
                className={`transaction-table__amount transaction-table__amount--${t.type}`}
              >
                {t.type === 'expense' ? '−' : '+'}
                {formatCurrency(t.amount)}
              </td>
              {showPayment && <td data-label="Payment">{t.paymentMethod}</td>}
              {showActions && (
                <td data-label="Actions" className="transaction-table__actions">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => onEdit(t)}
                    aria-label={`Edit ${t.description}`}
                  >
                    <Icon name="edit" size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    onClick={() => onDelete(t)}
                    aria-label={`Delete ${t.description}`}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
