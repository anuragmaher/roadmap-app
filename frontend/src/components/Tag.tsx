import React from 'react';
import { getTagCSSProperties } from '../utils/tagColors';
import { useTheme } from '../contexts/ThemeContext';

interface TagProps {
  children: React.ReactNode;
  variant?: 'default' | 'small' | 'large';
  className?: string;
}

const Tag: React.FC<TagProps> = ({ 
  children, 
  variant = 'default',
  className = '' 
}) => {
  const { isDark } = useTheme();
  const tagName = typeof children === 'string' ? children : '';
  const cssProperties = getTagCSSProperties(tagName, isDark);
  
  const sizeClasses = {
    small: 'tag-small',
    default: 'tag-default',
    large: 'tag-large'
  };

  return (
    <span 
      className={`tag-colorful ${sizeClasses[variant]} ${className}`}
      style={cssProperties}
    >
      {children}
    </span>
  );
};

export default Tag;
