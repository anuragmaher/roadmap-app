import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { roadmapApi, itemApi } from '../services/api';
import { Roadmap, Item } from '../types';
import { getAvailableQuarters, itemBelongsToQuarter } from '../utils/quarters';
import { useApi } from '../hooks/useApi';
import { handleApiError } from '../utils/errorHandler';
import Modal from '../components/Modal';
import ItemForm from '../components/ItemForm';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import Tag from '../components/Tag';

const RoadmapEditor: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  
  const { loading, error, handleApiCall, clearError } = useApi();

  const fetchRoadmapData = useCallback(async () => {
    await handleApiCall(async () => {
      const roadmapData = await roadmapApi.getBySlug(slug!);
      setRoadmap(roadmapData);
      if (roadmapData.items) {
        setItems(roadmapData.items);
      }
    });
  }, [slug, handleApiCall]);

  useEffect(() => {
    if (slug) {
      fetchRoadmapData();
    }
  }, [slug, fetchRoadmapData]);

  const handleCreateItem = async (formData: any) => {
    if (!roadmap) return;

    await handleApiCall(async () => {
      const item = await itemApi.create(roadmap._id, formData);
      setItems([...items, item]);
      setShowItemForm(false);
    });
  };

  const handleUpdateItem = async (formData: any) => {
    if (!editingItem) return;

    await handleApiCall(async () => {
      const updatedItem = await itemApi.update(editingItem._id, formData);
      setItems(items.map(item => item._id === updatedItem._id ? updatedItem : item));
      setEditingItem(null);
      setShowItemForm(false);
    });
  };

  const handleDeleteItem = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await handleApiCall(async () => {
        await itemApi.delete(itemId);
        setItems(items.filter(item => item._id !== itemId));
      });
    }
  };

  const startEditItem = (item: Item) => {
    setEditingItem(item);
    setShowItemForm(true);
  };


  const handleCloseModal = () => {
    setShowItemForm(false);
    setEditingItem(null);
  };

  const handleFormSubmit = editingItem ? handleUpdateItem : handleCreateItem;

  if (loading) return <LoadingSpinner message="Loading roadmap..." />;
  if (!roadmap) return <ErrorMessage error="Roadmap not found" />;

  // Group items by available quarters (including legacy quarters)
  const availableQuarters = getAvailableQuarters();
  const itemsByQuarter = availableQuarters.reduce((acc, quarter) => {
    acc[quarter.value] = items.filter(item => itemBelongsToQuarter(item.quarter, quarter.value));
    return acc;
  }, {} as Record<string, Item[]>);

  return (
    <div className="roadmap-editor">
      <div className="editor-header">
        <h1>Editing: {roadmap.title}</h1>
        <button 
          onClick={() => setShowItemForm(true)}
          className="add-item-btn"
        >
          Add Item
        </button>
      </div>

      <ErrorMessage error={error} onDismiss={clearError} />

      <Modal
        isOpen={showItemForm}
        onClose={handleCloseModal}
        title={editingItem ? 'Edit Item' : 'Add New Item'}
      >
        <ItemForm
          item={editingItem}
          onSubmit={handleFormSubmit}
          onCancel={handleCloseModal}
          isLoading={loading}
        />
      </Modal>

      <div className="quarters-grid">
        {availableQuarters.map((quarter) => {
          const quarterItems = itemsByQuarter[quarter.value] || [];
          return (
            <div key={quarter.value} className="quarter-column">
              <h2>{quarter.label}</h2>
            <div className="items-list">
              {quarterItems.map((item) => (
                <div key={item._id} className="item-card">
                  {item.image && (
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="item-image"
                      style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '0.375rem', marginBottom: '0.5rem' }}
                    />
                  )}
                  <div className="item-header">
                    <h4>{item.title}</h4>
                    <span className={`status-badge ${item.status}`}>
                      {item.status}
                    </span>
                  </div>
                  <p>{item.description}</p>
                  {item.tags.length > 0 && (
                    <div className="tags">
                      {item.tags.map((tag, index) => (
                        <Tag key={index} variant="small">
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  )}
                  <div className="item-actions">
                    <button 
                      onClick={() => startEditItem(item)}
                      className="edit-btn"
                      title="Edit item"
                    >
                    </button>
                    <button 
                      onClick={() => handleDeleteItem(item._id)}
                      className="delete-btn"
                      title="Delete item"
                    >
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoadmapEditor;