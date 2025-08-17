export interface ApiError {
  message: string;
  status?: number;
  details?: string;
}

export const extractErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.response?.data) {
    const data = error.response.data;
    return data.details || data.message || 'An error occurred';
  }

  if (error?.message) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

export const createApiError = (error: any): ApiError => {
  return {
    message: extractErrorMessage(error),
    status: error?.response?.status,
    details: error?.response?.data?.details
  };
};

export const handleApiError = (error: any, defaultMessage = 'An error occurred'): string => {
  console.error('API Error:', error);
  return extractErrorMessage(error) || defaultMessage;
};