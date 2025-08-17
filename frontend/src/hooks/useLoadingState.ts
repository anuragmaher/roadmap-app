import { useState } from 'react';

export interface UseLoadingStateReturn {
  loading: boolean;
  error: string;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  clearError: () => void;
}

export const useLoadingState = (initialLoading = false): UseLoadingStateReturn => {
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState('');

  const clearError = () => {
    setError('');
  };

  return {
    loading,
    error,
    setLoading,
    setError,
    clearError
  };
};