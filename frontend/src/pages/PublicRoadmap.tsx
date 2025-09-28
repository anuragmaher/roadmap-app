import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { roadmapApi } from '../services/api';
import { Roadmap } from '../types';
import Tag from '../components/Tag';
import VoteButton from '../components/VoteButton';

const PublicRoadmap: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRoadmap = useCallback(async () => {
    try {
      const data = await roadmapApi.getBySlug(slug!);
      setRoadmap(data);
    } catch (err) {
      setError('Failed to load roadmap');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      fetchRoadmap();
    }
  }, [slug, fetchRoadmap]);


  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!roadmap) return <div className="error">Roadmap not found</div>;

  const items = roadmap.items || [];
  
  // Separate items into Released (completed) and Coming Soon (all other statuses)
  const releasedItems = items.filter(item => item.status === 'completed');
  const comingSoonItems = items.filter(item => item.status !== 'completed');

  return (
    <div className="home">
      <div className="hero">
        <h1>{roadmap.title}</h1>
        <p>{roadmap.description}</p>
        <div className="roadmap-meta" style={{ color: 'white', opacity: 0.9, marginTop: '1rem' }}>
          <span>Created by: {roadmap.owner?.email || 'Unknown'}</span>
          <span> • Last updated: {new Date(roadmap.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>


      {/* Released Section */}
      <div className="status-section" style={{ marginTop: '4rem' }}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', margin: 0, color: 'var(--text-color)' }}>Released</h2>
          {releasedItems.length > 0 && (
            <Link to={`/roadmap/${slug}/released`} className="view-quarter-btn">
              View All Released Items
            </Link>
          )}
        </div>
        
        {releasedItems.length === 0 ? (
          <p className="no-items">No items have been released yet</p>
        ) : (
          <div className="items-half-row-grid">
            {releasedItems.slice(0, 4).map((item) => (
              <div key={item._id} className={`roadmap-item-card ${item.image ? 'has-image' : ''}`}>
                {item.image && (
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="item-image"
                  />
                )}
                <div className="item-header">
                  <h4>{item.title}</h4>
                  <span className={`status-badge ${item.status}`}>
                    {item.status.replace('-', ' ')}
                  </span>
                </div>
                <p className="item-description">{item.description}</p>
                <div className="item-meta">
                  <span className="quarter-info">{item.quarter}</span>
                </div>
                {item.tags && item.tags.length > 0 && (
                  <div className="tags">
                    {item.tags.map((tag, index) => (
                      <Tag key={index} variant="default">
                        {tag}
                      </Tag>
                    ))}
                  </div>
                )}
                {(item.prdLink || item.figmaLink) && (
                  <div className="item-links">
                    {item.prdLink && (
                      <a 
                        href={item.prdLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="link-btn prd-link"
                        title="View PRD"
                      >
                        📋 PRD
                      </a>
                    )}
                    {item.figmaLink && (
                      <a 
                        href={item.figmaLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="link-btn figma-link"
                        title="View Figma"
                      >
                        🎨 Figma
                      </a>
                    )}
                  </div>
                )}
                <VoteButton itemId={item._id} itemStatus={item.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Coming Soon Section */}
      <div className="status-section" style={{ marginTop: '4rem' }}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', margin: 0, color: 'var(--text-color)' }}>Coming Soon</h2>
        </div>
        
        {comingSoonItems.length === 0 ? (
          <p className="no-items">No upcoming items planned</p>
        ) : (
          <div className="items-half-row-grid">
            {comingSoonItems.map((item) => (
              <div key={item._id} className={`roadmap-item-card ${item.image ? 'has-image' : ''}`}>
                {item.image && (
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="item-image"
                  />
                )}
                <div className="item-header">
                  <h4>{item.title}</h4>
                  <span className={`status-badge ${item.status}`}>
                    {item.status.replace('-', ' ')}
                  </span>
                </div>
                <p className="item-description">{item.description}</p>
                <div className="item-meta">
                  <span className="quarter-info">{item.quarter}</span>
                </div>
                {item.tags && item.tags.length > 0 && (
                  <div className="tags">
                    {item.tags.map((tag, index) => (
                      <Tag key={index} variant="default">
                        {tag}
                      </Tag>
                    ))}
                  </div>
                )}
                {(item.prdLink || item.figmaLink) && (
                  <div className="item-links">
                    {item.prdLink && (
                      <a 
                        href={item.prdLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="link-btn prd-link"
                        title="View PRD"
                      >
                        📋 PRD
                      </a>
                    )}
                    {item.figmaLink && (
                      <a 
                        href={item.figmaLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="link-btn figma-link"
                        title="View Figma"
                      >
                        🎨 Figma
                      </a>
                    )}
                  </div>
                )}
                <VoteButton itemId={item._id} itemStatus={item.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicRoadmap;
