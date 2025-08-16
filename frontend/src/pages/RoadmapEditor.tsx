import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { roadmapApi, itemApi } from '../services/api';
import { Roadmap, Item } from '../types';

const RoadmapEditor: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    quarter: 'Q1' as 'Q1' | 'Q2' | 'Q3' | 'Q4',
    tags: [] as string[],
    status: 'planned' as 'planned' | 'in-progress' | 'completed' | 'cancelled',
    order: 0
  });

  const fetchRoadmapData = useCallback(async () => {
    try {
      const roadmapData = await roadmapApi.getBySlug(slug!);
      setRoadmap(roadmapData);
      if (roadmapData.items) {
        setItems(roadmapData.items);
      }
    } catch (err) {
      setError('Failed to load roadmap');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      fetchRoadmapData();
    }
  }, [slug, fetchRoadmapData]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roadmap) return;

    try {
      const item = await itemApi.create(roadmap._id, newItem);
      setItems([...items, item]);
      setNewItem({
        title: '',
        description: '',
        quarter: 'Q1',
        tags: [],
        status: 'planned',
        order: 0
      });
      setShowItemForm(false);
    } catch (err) {
      setError('Failed to create item');
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const updatedItem = await itemApi.update(editingItem._id, newItem);
      setItems(items.map(item => item._id === updatedItem._id ? updatedItem : item));
      setEditingItem(null);
      setNewItem({
        title: '',
        description: '',
        quarter: 'Q1',
        tags: [],
        status: 'planned',
        order: 0
      });
      setShowItemForm(false);
    } catch (err) {
      setError('Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await itemApi.delete(itemId);
        setItems(items.filter(item => item._id !== itemId));
      } catch (err) {
        setError('Failed to delete item');
      }
    }
  };

  const startEditItem = (item: Item) => {
    setEditingItem(item);
    setNewItem({
      title: item.title,
      description: item.description,
      quarter: item.quarter,
      tags: item.tags,
      status: item.status,
      order: item.order
    });
    setShowItemForm(true);
  };

  const handleTagInput = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setNewItem({...newItem, tags});
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!roadmap) return <div className="error">Roadmap not found</div>;

  const itemsByQuarter = {
    Q1: items.filter(item => item.quarter === 'Q1'),
    Q2: items.filter(item => item.quarter === 'Q2'),
    Q3: items.filter(item => item.quarter === 'Q3'),
    Q4: items.filter(item => item.quarter === 'Q4')
  };

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

      {error && <div className="error-message">{error}</div>}

      {showItemForm && (
        <div className="modal">
          <div className="modal-content">
            <h3>{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
            <form onSubmit={editingItem ? handleUpdateItem : handleCreateItem}>
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  value={newItem.title}
                  onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="quarter">Quarter</label>
                  <select
                    id="quarter"
                    value={newItem.quarter}
                    onChange={(e) => setNewItem({...newItem, quarter: e.target.value as any})}
                  >
                    <option value="Q1">Q1</option>
                    <option value="Q2">Q2</option>
                    <option value="Q3">Q3</option>
                    <option value="Q4">Q4</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    value={newItem.status}
                    onChange={(e) => setNewItem({...newItem, status: e.target.value as any})}
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
                  value={newItem.tags.join(', ')}
                  onChange={(e) => handleTagInput(e.target.value)}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  {editingItem ? 'Update' : 'Create'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowItemForm(false);
                    setEditingItem(null);
                    setNewItem({
                      title: '',
                      description: '',
                      quarter: 'Q1',
                      tags: [],
                      status: 'planned',
                      order: 0
                    });
                  }}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="quarters-grid">
        {Object.entries(itemsByQuarter).map(([quarter, quarterItems]) => (
          <div key={quarter} className="quarter-column">
            <h2>{quarter}</h2>
            <div className="items-list">
              {quarterItems.map((item) => (
                <div key={item._id} className="item-card">
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
                        <span key={index} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="item-actions">
                    <button 
                      onClick={() => startEditItem(item)}
                      className="edit-btn"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteItem(item._id)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoadmapEditor;