import { useState, useEffect } from 'react';
import { Category } from '@/types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Mock categories for now
      const mockCategories: Category[] = [
        {
          id: '1',
          userId: 'user1',
          name: 'Food & Dining',
          icon: 'restaurant',
          color: '#FF6B6B',
          isDefault: true,
          createdAt: new Date(),
        },
        {
          id: '2',
          userId: 'user1',
          name: 'Transportation',
          icon: 'directions-car',
          color: '#4ECDC4',
          isDefault: true,
          createdAt: new Date(),
        },
      ];
      setCategories(mockCategories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  return {
    categories,
    isLoading,
    error,
    loadCategories,
  };
}
export default useCategories;
