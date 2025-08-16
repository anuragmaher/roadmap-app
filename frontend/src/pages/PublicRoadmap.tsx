import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { roadmapApi } from '../services/api';
import { Roadmap } from '../types';
import { getAvailableQuarters, parseQuarterValue, itemBelongsToQuarter } from '../utils/quarters';
import Tag from '../components/Tag';

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
  const availableQuarters = getAvailableQuarters();
  
  // Get all unique quarters from items (including legacy format)
  const allQuartersInItems = Array.from(new Set(items.map(item => item.quarter)));
  
  // Create a combined list of quarters: available quarters + any legacy quarters
  const allQuarters = [...availableQuarters];
  allQuartersInItems.forEach(itemQuarter => {
    // If it's a legacy quarter not already covered, add it
    if (!availableQuarters.some(q => itemBelongsToQuarter(itemQuarter, q.value))) {
      try {
        const parsed = parseQuarterValue(itemQuarter);
        allQuarters.push(parsed);
      } catch {
        // If we can't parse it, create a simple display
        allQuarters.push({
          year: new Date().getFullYear(),
          quarter: 0,
          label: itemQuarter,
          value: itemQuarter
        });
      }
    }
  });
  
  const itemsByQuarter = allQuarters.reduce((acc, quarter) => {
    acc[quarter.value] = items.filter(item => itemBelongsToQuarter(item.quarter, quarter.value));
    return acc;
  }, {} as Record<string, typeof items>);

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


      <div className="quarter-navigation" style={{ marginTop: '4rem' }}>
        <h2>View by Quarter</h2>
        <div className="quarter-links">
          {availableQuarters.map(quarter => (
            <Link 
              key={quarter.value}
              to={`/roadmap/${slug}/${quarter.value.toLowerCase()}`} 
              className="quarter-link"
            >
              {quarter.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="quarters-overview">
        {allQuarters.map(quarter => {
          const quarterItems = itemsByQuarter[quarter.value] || [];
          return (
            <div key={quarter.value} className="status-section">
              <div className="quarter-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0, color: 'var(--text-color)' }}>{quarter.label}</h3>
                <Link to={`/roadmap/${slug}/${quarter.value.toLowerCase()}`} className="view-quarter-btn">
                  View {quarter.label} Details
                </Link>
              </div>
              
              {quarterItems.length === 0 ? (
                <p className="no-items">No items planned for {quarter.label}</p>
              ) : (
                <div className="items-half-row-grid">
                  {quarterItems.map((item) => (
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PublicRoadmap;