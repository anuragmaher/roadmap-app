import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { roadmapApi } from '../services/api';
import { Roadmap } from '../types';

const Dashboard: React.FC = () => {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRoadmap, setNewRoadmap] = useState({
    title: '',
    description: '',
    isPublic: true
  });

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const fetchRoadmaps = async () => {
    try {
      const data = await roadmapApi.getUserRoadmaps();
      setRoadmaps(data);
    } catch (err) {
      setError('Failed to load roadmaps');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const roadmap = await roadmapApi.create(newRoadmap);
      setRoadmaps([roadmap, ...roadmaps]);
      setNewRoadmap({ title: '', description: '', isPublic: true });
      setShowCreateForm(false);
    } catch (err) {
      setError('Failed to create roadmap');
    }
  };

  const handleDeleteRoadmap = async (slug: string) => {
    if (window.confirm('Are you sure you want to delete this roadmap?')) {
      try {
        await roadmapApi.delete(slug);
        setRoadmaps(roadmaps.filter(r => r.slug !== slug));
      } catch (err) {
        setError('Failed to delete roadmap');
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>My Roadmaps</h1>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="create-btn"
        >
          Create New Roadmap
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showCreateForm && (
        <div className="modal">
          <div className="modal-content">
            <h3>Create New Roadmap</h3>
            <form onSubmit={handleCreateRoadmap}>
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  value={newRoadmap.title}
                  onChange={(e) => setNewRoadmap({...newRoadmap, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={newRoadmap.description}
                  onChange={(e) => setNewRoadmap({...newRoadmap, description: e.target.value})}
                />
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newRoadmap.isPublic}
                    onChange={(e) => setNewRoadmap({...newRoadmap, isPublic: e.target.checked})}
                  />
                  Make public
                </label>
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-btn">Create</button>
                <button 
                  type="button" 
                  onClick={() => setShowCreateForm(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="roadmap-list">
        {roadmaps.length === 0 ? (
          <p>No roadmaps yet. Create your first roadmap!</p>
        ) : (
          roadmaps.map((roadmap) => (
            <div key={roadmap._id} className="roadmap-item">
              <div className="roadmap-info">
                <h3>{roadmap.title}</h3>
                <p>{roadmap.description}</p>
                <div className="roadmap-meta">
                  <span className={`status ${roadmap.isPublic ? 'public' : 'private'}`}>
                    {roadmap.isPublic ? 'Public' : 'Private'}
                  </span>
                  <span>{new Date(roadmap.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="roadmap-actions">
                <Link to={`/roadmap/${roadmap.slug}/edit`} className="edit-btn">
                  Edit
                </Link>
                <Link to={`/roadmap/${roadmap.slug}`} className="view-btn">
                  View
                </Link>
                <button 
                  onClick={() => handleDeleteRoadmap(roadmap.slug)}
                  className="delete-btn"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
