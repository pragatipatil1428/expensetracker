import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { transactionService } from '../services/transactionService.js';
import { getErrorMessage } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import TransactionForm from '../components/features/TransactionForm.jsx';
import Button from '../components/ui/Button.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import { PageLoader } from '../components/ui/Spinner.jsx';

export default function TransactionFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  useDocumentTitle(isEdit ? 'Edit Transaction' : 'Add Transaction');

  const navigate = useNavigate();
  const { toast } = useToast();

  const [initial, setInitial] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    setLoading(true);
    transactionService
      .get(id)
      .then(({ data }) => {
        if (!cancelled) setInitial(data.transaction);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Could not load this transaction'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const handleSubmit = async (payload) => {
    setSaving(true);
    try {
      if (isEdit) {
        await transactionService.update(id, payload);
        toast('Transaction updated');
      } else {
        await transactionService.create(payload);
        toast('Transaction added');
      }
      navigate('/transactions');
    } catch (err) {
      toast(getErrorMessage(err, 'Could not save the transaction'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader label="Loading transaction…" />;

  if (error) {
    return (
      <div className="page">
        <ErrorState
          title="Transaction not found"
          message={error}
          onRetry={() => navigate('/transactions')}
          retryLabel="Back to transactions"
        />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">
            {isEdit ? 'Edit Transaction' : 'Add Transaction'}
          </h1>
          <p className="page__subtitle">
            {isEdit
              ? 'Update the details of this transaction.'
              : 'Record a new income or expense.'}
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/transactions')}>
          Cancel
        </Button>
      </div>

      <div className="card form-card">
        <TransactionForm
          initialValues={initial || undefined}
          onSubmit={handleSubmit}
          submitLabel={isEdit ? 'Save Changes' : 'Add Transaction'}
          loading={saving}
        />
      </div>
    </div>
  );
}
