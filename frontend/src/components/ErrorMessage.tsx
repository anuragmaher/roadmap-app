import React from 'react';

interface ErrorMessageProps {
  error: string;
  onDismiss?: () => void;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onDismiss, className = '' }) => {
  if (!error) return null;

  return (
    <div className={`error-message ${className}`}>
      <span className="error-text">{error}</span>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="error-dismiss-btn"
          aria-label="Dismiss error"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;