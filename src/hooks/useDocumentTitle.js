import { useEffect } from 'react';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Spendly` : 'Spendly — Personal Expense Tracker';
  }, [title]);
}
