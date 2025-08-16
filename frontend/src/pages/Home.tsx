import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { roadmapApi } from '../services/api';
import { Roadmap } from '../types';

const Home: React.FC = () => {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPublicRoadmaps = async () => {
      try {
        const data = await roadmapApi.getPublic();
        setRoadmaps(data);
      } catch (err) {
        setError('Failed to load roadmaps');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicRoadmaps();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="home">
      <div className="hero">
        <h1>Roadmap Publishing Platform</h1>
        <p>Create, share, and track roadmaps with quarterly views</p>
        <Link to="/register" className="cta-btn">Get Started</Link>
      </div>

      <div className="public-roadmaps">
        <h2>Public Roadmaps</h2>
        {error && <div className="error-message">{error}</div>}
        
        {roadmaps.length === 0 ? (
          <p>No public roadmaps available yet.</p>
        ) : (
          <div className="roadmap-grid">
            {roadmaps.map((roadmap) => (
              <div key={roadmap._id} className="roadmap-card">
                <h3>{roadmap.title}</h3>
                <p>{roadmap.description}</p>
                <div className="roadmap-meta">
                  <span>By: {roadmap.owner?.email || 'Unknown'}</span>
                  <div className="quarter-links">
                    <Link to={`/roadmap/${roadmap.slug}/q1`}>Q1</Link>
                    <Link to={`/roadmap/${roadmap.slug}/q2`}>Q2</Link>
                    <Link to={`/roadmap/${roadmap.slug}/q3`}>Q3</Link>
                    <Link to={`/roadmap/${roadmap.slug}/q4`}>Q4</Link>
                  </div>
                </div>
                <Link to={`/roadmap/${roadmap.slug}`} className="view-btn">
                  View Full Roadmap
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;