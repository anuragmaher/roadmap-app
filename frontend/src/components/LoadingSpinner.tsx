import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 'medium',
  className = ''
}) => {
  return (
    <div className={`loading ${size} ${className}`}>
      <div className="loading-spinner" />
      <span className="loading-message">{message}</span>
    </div>
  );
};

export default LoadingSpinner;
