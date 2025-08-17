import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { roadmapApi, itemApi } from '../services/api';
import { Item } from '../types';
import Tag from '../components/Tag';

const Home: React.FC = () => {
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPublicRoadmapsAndItems = async () => {
      try {
        const roadmapsData = await roadmapApi.getPublic();
        
        // Ensure data is an array
        if (Array.isArray(roadmapsData)) {
          
          // Fetch all items from all public roadmaps
          const itemsPromises = roadmapsData.map(async (roadmap) => {
            try {
              const items = await itemApi.getByRoadmap(roadmap._id);
              return items.map(item => ({ ...item, roadmapTitle: roadmap.title, roadmapSlug: roadmap.slug }));
            } catch (err) {
              console.error(`Failed to fetch items for roadmap ${roadmap._id}:`, err);
              return [];
            }
          });
          
          const allItemsArrays = await Promise.all(itemsPromises);
          const flattenedItems = allItemsArrays.flat();
          setAllItems(flattenedItems);
        } else {
          console.error('API did not return an array:', roadmapsData);
          setError('Invalid response format from server');
        }
      } catch (err: any) {
        console.error('API error:', err);
        setError(`Failed to load roadmaps: ${err.response?.data?.message || err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicRoadmapsAndItems();
  }, []);

  // Function to sort items by quarter chronologically
  const sortItemsByQuarter = (items: Item[]) => {
    return items.sort((a, b) => {
      // Extract year and quarter from format like "2025-Q2" or legacy "Q2"
      const parseQuarter = (quarter: string) => {
        if (quarter.includes('-')) {
          // New format: "2025-Q2"
          const [year, q] = quarter.split('-');
          return { year: parseInt(year), quarter: parseInt(q.replace('Q', '')) };
        } else {
          // Legacy format: "Q2" - assume current year
          const currentYear = new Date().getFullYear();
          return { year: currentYear, quarter: parseInt(quarter.replace('Q', '')) };
        }
      };

      const aQuarter = parseQuarter(a.quarter);
      const bQuarter = parseQuarter(b.quarter);

      // Sort by year first, then by quarter
      if (aQuarter.year !== bQuarter.year) {
        return aQuarter.year - bQuarter.year;
      }
      return aQuarter.quarter - bQuarter.quarter;
    });
  };

  // Organize items by status and sort each group by quarter
  const completedItems = sortItemsByQuarter(allItems.filter(item => item.status === 'completed'));
  const inProgressItems = sortItemsByQuarter(allItems.filter(item => item.status === 'in-progress'));
  const plannedItems = sortItemsByQuarter(allItems.filter(item => item.status === 'planned'));

  const renderItemsSection = (title: string, items: Item[], statusClass: string) => {
    if (items.length === 0) return null;
    
    return (
      <div className="status-section">
        <h3 className={`status-section-title ${statusClass}`}>{title}</h3>
        <div className="items-half-row-grid">
          {items.map((item: any) => (
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
                  {item.tags.map((tag: string, index: number) => (
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
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="home">
      <div className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Hiver AI Roadmap</h1>
            <p>Explore our AI-powered initiatives and upcoming features for customer support excellence</p>
            <Link to="/roadmap/hiver-ai" className="cta-btn">View Full Roadmap</Link>
          </div>
          <div className="hero-image">
            <img src="/hero-illustration.svg" alt="AI Roadmap Illustration" />
          </div>
        </div>
      </div>

      <section className="initiatives-container">
        <div className="ai-initiatives">
          <h2>AI Initiatives & Features</h2>
        {error && <div className="error-message">{error}</div>}
        
        {allItems.length === 0 ? (
          <div className="hiver-roadmap-placeholder">
            <p>Our AI roadmap is being prepared. Check back soon for exciting updates!</p>
            <div className="ai-highlights">
              <div className="highlight-card">
                <h3>🤖 Smart Email Classification</h3>
                <p>AI-powered automatic email categorization and routing</p>
              </div>
              <div className="highlight-card">
                <h3>💬 Intelligent Response Suggestions</h3>
                <p>Context-aware response recommendations for faster support</p>
              </div>
              <div className="highlight-card">
                <h3>📊 Predictive Analytics</h3>
                <p>AI-driven insights for customer support optimization</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="all-initiatives">
            {renderItemsSection('✅ Completed', completedItems, 'completed')}
            {renderItemsSection('🚧 In Progress', inProgressItems, 'in-progress')}
            {renderItemsSection('📋 Planned', plannedItems, 'planned')}
          </div>
        )}
        </div>
      </section>
    </div>
  );
};

export default Home;
