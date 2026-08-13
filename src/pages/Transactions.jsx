import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { transactionService } from '../services/transactionService.js';
import { getErrorMessage } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { CATEGORIES, SORT_OPTIONS } from '../utils/constants.js';
import { exportTransactionsToCSV } from '../utils/csv.js';
import TransactionTable from '../components/features/TransactionTable.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Icon from '../components/ui/Icon.jsx';
import { PageLoader } from '../components/ui/Spinner.jsx';

export default function Transactions() {
  useDocumentTitle('Transactions');
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchAll = useFetch(
    () => transactionService.list({ limit: 1000 }).then((r) => r.data.transactions),
    []
  );

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState('newest');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const hasAnyFilters =
    search.trim() || typeFilter || categoryFilter || from || to;

  const filtered = useMemo(() => {
    const list = fetchAll.data || [];
    let result = list;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }
    if (typeFilter) result = result.filter((t) => t.type === typeFilter);
    if (categoryFilter) result = result.filter((t) => t.category === categoryFilter);
    if (from) result = result.filter((t) => new Date(t.date) >= new Date(`${from}T00:00:00`));
    if (to) {
      const end = new Date(`${to}T23:59:59.999`);
      result = result.filter((t) => new Date(t.date) <= end);
    }

    const byDateDesc = (a, b) => new Date(b.date) - new Date(a.date);
    switch (sort) {
      case 'oldest':
        result = [...result].sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'amount_desc':
        result = [...result].sort((a, b) => b.amount - a.amount);
        break;
      case 'amount_asc':
        result = [...result].sort((a, b) => a.amount - b.amount);
        break;
      default:
        result = [...result].sort(byDateDesc);
    }
    return result;
  }, [fetchAll.data, search, typeFilter, categoryFilter, from, to, sort]);

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('');
    setCategoryFilter('');
    setFrom('');
    setTo('');
    setSort('newest');
  };

  const handleExport = () => {
    if (!filtered.length) {
      toast('Nothing to export with the current filters', 'info');
      return;
    }
    exportTransactionsToCSV(filtered);
    toast(`Exported ${filtered.length} transaction${filtered.length === 1 ? '' : 's'} to CSV`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await transactionService.remove(deleteTarget._id);
      toast('Transaction deleted');
      setDeleteTarget(null);
      await fetchAll.refetch();
    } catch (err) {
      toast(getErrorMessage(err, 'Could not delete the transaction'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (fetchAll.loading) return <PageLoader label="Loading transactions…" />;

  if (fetchAll.error) {
    return (
      <div className="page">
        <ErrorState
          title="Could not load transactions"
          message={getErrorMessage(fetchAll.error)}
          onRetry={fetchAll.refetch}
        />
      </div>
    );
  }

  const totalCount = fetchAll.data?.length || 0;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Transactions</h1>
          <p className="page__subtitle">
            {totalCount > 0
              ? `${filtered.length} of ${totalCount} transaction${totalCount === 1 ? '' : 's'}`
              : 'Manage all your income and expenses'}
          </p>
        </div>
        <div className="page__header-actions">
          <Button variant="secondary" icon="download" onClick={handleExport}>
            Export CSV
          </Button>
          <Button icon="plus" onClick={() => navigate('/transactions/new')}>
            Add Transaction
          </Button>
        </div>
      </div>

      {totalCount > 0 && (
        <div className="filters card">
          <div className="filters__search">
            <Icon name="search" size={16} />
            <input
              type="search"
              className="filters__search-input"
              placeholder="Search by description or category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search transactions"
            />
          </div>
          <Select
            label="Type"
            name="type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            placeholder="All types"
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </Select>
          <Select
            label="Category"
            name="category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            placeholder="All categories"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Input
            label="From"
            name="from-date"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <Input
            label="To"
            name="to-date"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <Select
            label="Sort by"
            name="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          {hasAnyFilters && (
            <button type="button" className="filters__clear" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      )}

      <div className="card transactions-card">
        {totalCount === 0 ? (
          <EmptyState
            icon="wallet"
            title="No transactions yet"
            description="Start by adding your first income or expense."
            action={
              <Button icon="plus" onClick={() => navigate('/transactions/new')}>
                Add Transaction
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="search"
            title="No matching transactions"
            description="Try adjusting your search or filters."
            action={
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <TransactionTable
            transactions={filtered}
            onEdit={(t) => navigate(`/transactions/${t._id}/edit`)}
            onDelete={(t) => setDeleteTarget(t)}
          />
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete transaction?"
        message={
          deleteTarget
            ? `"${deleteTarget.description}" (${formatCurrencyAmount(deleteTarget.amount)}) will be permanently removed. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function formatCurrencyAmount(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
