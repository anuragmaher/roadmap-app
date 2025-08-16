import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { roadmapApi } from '../services/api';
import { Roadmap } from '../types';
import { getAvailableQuarters, parseQuarterValue, itemBelongsToQuarter } from '../utils/quarters';

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
            <div key={quarter.value} className="quarter-section">
            <div className="quarter-header">
              <h3>{quarter.label}</h3>
              <Link to={`/roadmap/${slug}/${quarter.value.toLowerCase()}`} className="view-quarter-btn">
                View {quarter.label} Details
              </Link>
            </div>
            
            {quarterItems.length === 0 ? (
              <p className="no-items">No items planned for {quarter.label}</p>
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
          );
        })}
      </div>

      <div className="all-items">
        <h2>All Items</h2>
        <div className="items-grid">
          {items.map((item) => (
            <div key={item._id} className="item-card">
              <div className="item-header">
                <h4>{item.title}</h4>
                <div className="item-badges">
                  <span className="quarter-badge">
                    {(() => {
                      try {
                        return parseQuarterValue(item.quarter).label;
                      } catch {
                        return item.quarter; // Fallback to original value
                      }
                    })()}
                  </span>
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