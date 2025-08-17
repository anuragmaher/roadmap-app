import { useState, useCallback } from 'react';

export interface UseApiReturn {
  loading: boolean;
  error: string;
  handleApiCall: <T>(apiCall: () => Promise<T>) => Promise<T>;
  clearError: () => void;
}

export const useApi = (): UseApiReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApiCall = useCallback(async <T,>(apiCall: () => Promise<T>): Promise<T> => {
    setLoading(true);
    setError('');
    try {
      const result = await apiCall();
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.details || 
                          err.response?.data?.message || 
                          err.message || 
                          'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = () => {
    setError('');
  };

  return { loading, error, handleApiCall, clearError };
};
