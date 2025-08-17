import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { itemApi } from '../services/api';
import { Item } from '../types';
import Tag from '../components/Tag';

const QuarterView: React.FC = () => {
  const { slug, quarter } = useParams<{ slug: string; quarter: string }>();
  const [data, setData] = useState<{
    roadmap: {
      title: string;
      description: string;
      slug: string;
    };
    quarter: string;
    items: Item[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchQuarterData = useCallback(async () => {
    try {
      const response = await itemApi.getByQuarter(slug!, quarter!);
      setData(response);
    } catch (err) {
      setError('Failed to load quarter data');
    } finally {
      setLoading(false);
    }
  }, [slug, quarter]);

  useEffect(() => {
    if (slug && quarter) {
      fetchQuarterData();
    }
  }, [slug, quarter, fetchQuarterData]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!data) return <div className="error">Quarter data not found</div>;

  const statusGroups = {
    planned: data.items.filter(item => item.status === 'planned'),
    'in-progress': data.items.filter(item => item.status === 'in-progress'),
    completed: data.items.filter(item => item.status === 'completed'),
    cancelled: data.items.filter(item => item.status === 'cancelled')
  };

  return (
    <div className="quarter-view">
      <div className="quarter-header">
        <div className="breadcrumb">
          <Link to={`/roadmap/${slug}`}>{data.roadmap.title}</Link>
          <span> / </span>
          <span>{data.quarter}</span>
        </div>
        <h1>{data.quarter} - {data.roadmap.title}</h1>
        <p>{data.roadmap.description}</p>
      </div>

      <div className="quarter-navigation">
        <div className="quarter-links">
          <Link 
            to={`/roadmap/${slug}/q1`} 
            className={`quarter-link ${quarter?.toLowerCase() === 'q1' ? 'active' : ''}`}
          >
            Q1
          </Link>
          <Link 
            to={`/roadmap/${slug}/q2`} 
            className={`quarter-link ${quarter?.toLowerCase() === 'q2' ? 'active' : ''}`}
          >
            Q2
          </Link>
          <Link 
            to={`/roadmap/${slug}/q3`} 
            className={`quarter-link ${quarter?.toLowerCase() === 'q3' ? 'active' : ''}`}
          >
            Q3
          </Link>
          <Link 
            to={`/roadmap/${slug}/q4`} 
            className={`quarter-link ${quarter?.toLowerCase() === 'q4' ? 'active' : ''}`}
          >
            Q4
          </Link>
        </div>
      </div>

      {data.items.length === 0 ? (
        <div className="no-items">
          <h2>No items planned for {data.quarter}</h2>
          <p>This quarter doesn't have any roadmap items yet.</p>
        </div>
      ) : (
        <>
          <div className="quarter-stats">
            <div className="stat">
              <span className="stat-number">{data.items.length}</span>
              <span className="stat-label">Total Items</span>
            </div>
            <div className="stat">
              <span className="stat-number">{statusGroups.completed.length}</span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat">
              <span className="stat-number">{statusGroups['in-progress'].length}</span>
              <span className="stat-label">In Progress</span>
            </div>
            <div className="stat">
              <span className="stat-number">{statusGroups.planned.length}</span>
              <span className="stat-label">Planned</span>
            </div>
          </div>

          <div className="status-columns">
            {Object.entries(statusGroups).map(([status, items]) => (
              <div key={status} className="status-column">
                <h3 className={`status-header ${status}`}>
                  {status.replace('-', ' ').toUpperCase()} ({items.length})
                </h3>
                <div className="items-list">
                  {items.map((item) => (
                    <div key={item._id} className="item-card">
                      <h4>{item.title}</h4>
                      <p>{item.description}</p>
                      {item.tags.length > 0 && (
                        <div className="tags">
                          {item.tags.map((tag, index) => (
                            <Tag key={index} variant="default">
                              {tag}
                            </Tag>
                          ))}
                        </div>
                      )}
                      <div className="item-meta">
                        <span>Updated: {new Date(item.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default QuarterView;
