import { useState, useEffect } from 'react';
import { Budget } from '@/types';

export function useBudget() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBudgets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Mock implementation
      setBudgets([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load budgets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, []);

  return {
    budgets,
    isLoading,
    error,
    loadBudgets,
  };
}export default useBudget;