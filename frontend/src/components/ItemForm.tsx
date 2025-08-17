import React, { useState, useEffect } from 'react';
import { Item } from '../types';
import { getQuarterOptions } from '../utils/quarters';
import ImageUpload from './ImageUpload';

interface ItemFormData {
  title: string;
  description: string;
  quarter: string;
  tags: string[];
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  order: number;
  image: string | null;
  prdLink?: string;
  figmaLink?: string;
}

interface ItemFormProps {
  item?: Item | null;
  onSubmit: (data: ItemFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const ItemForm: React.FC<ItemFormProps> = ({ item, onSubmit, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState<ItemFormData>({
    title: '',
    description: '',
    quarter: getQuarterOptions()[1]?.value || '2025-Q3',
    tags: [],
    status: 'planned',
    order: 0,
    image: null,
    prdLink: '',
    figmaLink: ''
  });

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title,
        description: item.description,
        quarter: item.quarter,
        tags: item.tags,
        status: item.status,
        order: item.order,
        image: item.image || null,
        prdLink: item.prdLink || '',
        figmaLink: item.figmaLink || ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        quarter: getQuarterOptions()[1]?.value || '2025-Q3',
        tags: [],
        status: 'planned',
        order: 0,
        image: null,
        prdLink: '',
        figmaLink: ''
      });
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleTagInput = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData({ ...formData, tags });
  };

  const updateFormData = (field: keyof ItemFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="title">Title</label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => updateFormData('title', e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData('description', e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="quarter">Quarter</label>
          <select
            id="quarter"
            value={formData.quarter}
            onChange={(e) => updateFormData('quarter', e.target.value)}
            disabled={isLoading}
          >
            {getQuarterOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => updateFormData('status', e.target.value as any)}
            disabled={isLoading}
          >
            <option value="planned">Planned</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="tags">Tags (comma-separated)</label>
        <input
          type="text"
          id="tags"
          value={formData.tags.join(', ')}
          onChange={(e) => handleTagInput(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="prdLink">PRD Link</label>
          <input
            type="url"
            id="prdLink"
            value={formData.prdLink || ''}
            onChange={(e) => updateFormData('prdLink', e.target.value)}
            disabled={isLoading}
            placeholder="https://..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="figmaLink">Figma Link</label>
          <input
            type="url"
            id="figmaLink"
            value={formData.figmaLink || ''}
            onChange={(e) => updateFormData('figmaLink', e.target.value)}
            disabled={isLoading}
            placeholder="https://figma.com/..."
          />
        </div>
      </div>

      <ImageUpload
        currentImage={formData.image}
        onImageChange={(imageData) => updateFormData('image', imageData)}
        disabled={isLoading}
      />

      <div className="form-actions">
        <button type="submit" className="submit-btn" disabled={isLoading}>
          {item ? 'Update' : 'Create'}
        </button>
        <button 
          type="button" 
          onClick={onCancel}
          className="cancel-btn"
          disabled={isLoading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ItemForm;
