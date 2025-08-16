import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { roadmapApi } from '../services/api';
import { Roadmap, Item } from '../types';

const PublicRoadmap: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (slug) {
      fetchRoadmap();
    }
  }, [slug]);

  const fetchRoadmap = async () => {
    try {
      const data = await roadmapApi.getBySlug(slug!);
      setRoadmap(data);
    } catch (err) {
      setError('Failed to load roadmap');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!roadmap) return <div className="error">Roadmap not found</div>;

  const items = roadmap.items || [];
  const itemsByQuarter = {
    Q1: items.filter(item => item.quarter === 'Q1'),
    Q2: items.filter(item => item.quarter === 'Q2'),
    Q3: items.filter(item => item.quarter === 'Q3'),
    Q4: items.filter(item => item.quarter === 'Q4')
  };

  return (
    <div className="public-roadmap">
      <div className="roadmap-header">
        <h1>{roadmap.title}</h1>
        <p>{roadmap.description}</p>
        <div className="roadmap-meta">
          <span>Created by: {roadmap.owner?.email || 'Unknown'}</span>
          <span>Last updated: {new Date(roadmap.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="quarter-navigation">
        <h2>View by Quarter:</h2>
        <div className="quarter-links">
          <Link to={`/roadmap/${slug}/q1`} className="quarter-link">Q1</Link>
          <Link to={`/roadmap/${slug}/q2`} className="quarter-link">Q2</Link>
          <Link to={`/roadmap/${slug}/q3`} className="quarter-link">Q3</Link>
          <Link to={`/roadmap/${slug}/q4`} className="quarter-link">Q4</Link>
        </div>
      </div>

      <div className="quarters-overview">
        {Object.entries(itemsByQuarter).map(([quarter, quarterItems]) => (
          <div key={quarter} className="quarter-section">
            <div className="quarter-header">
              <h3>{quarter}</h3>
              <Link to={`/roadmap/${slug}/${quarter.toLowerCase()}`} className="view-quarter-btn">
                View {quarter} Details
              </Link>
            </div>
            
            {quarterItems.length === 0 ? (
              <p className="no-items">No items planned for {quarter}</p>
            ) : (
              <div className="items-preview">
                {quarterItems.slice(0, 3).map((item) => (
                  <div key={item._id} className="item-preview">
                    <h4>{item.title}</h4>
                    <span className={`status-badge ${item.status}`}>
                      {item.status}
                    </span>
                    {item.tags.length > 0 && (
                      <div className="tags">
                        {item.tags.map((tag, index) => (
                          <span key={index} className="tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {quarterItems.length > 3 && (
                  <p className="more-items">
                    +{quarterItems.length - 3} more items
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="all-items">
        <h2>All Items</h2>
        <div className="items-grid">
          {items.map((item) => (
            <div key={item._id} className="item-card">
              <div className="item-header">
                <h4>{item.title}</h4>
                <div className="item-badges">
                  <span className="quarter-badge">{item.quarter}</span>
                  <span className={`status-badge ${item.status}`}>
                    {item.status}
                  </span>
                </div>
              </div>
              <p>{item.description}</p>
              {item.tags.length > 0 && (
                <div className="tags">
                  {item.tags.map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PublicRoadmap;