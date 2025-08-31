import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { roadmapApi } from '../services/api';
import { Item } from '../types';
import Tag from '../components/Tag';
import VoteButton from '../components/VoteButton';
import { getTenantInfoAsync, getProductName, getProductDescription, getHeroTitle, TenantInfo } from '../utils/tenantUtils';

const Home: React.FC = () => {
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [firstRoadmapSlug, setFirstRoadmapSlug] = useState<string | null>(null);
  const [, setTenantSettings] = useState<any>(null);
  const [tenantInfo, setTenantInfo] = useState<TenantInfo>(() => ({
    isMainDomain: true,
    isSubdomain: false,
    isCustomDomain: false,
    subdomain: null,
    hostname: window.location.hostname
  })); // Will be updated by API response
  
  // Get tenant information (will be updated by async call)
  const productName = getProductName(tenantInfo);
  const productDescription = getProductDescription(tenantInfo);
  const heroTitle = getHeroTitle(tenantInfo);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        // Use optimized endpoint that fetches all data in one call with caching
        const homeData = await roadmapApi.getHomeData();
        
        // Update tenant info from the response
        const updatedTenantInfo = {
          isMainDomain: homeData.tenant.domainInfo.isMainDomain,
          isSubdomain: homeData.tenant.domainInfo.isSubdomain,
          isCustomDomain: homeData.tenant.domainInfo.isCustomDomain,
          subdomain: homeData.tenant.subdomain,
          hostname: homeData.tenant.domainInfo.hostname
        };
        setTenantInfo(updatedTenantInfo);
        
        // Set tenant settings
        setTenantSettings(homeData.tenant);
        
        // Set roadmap data
        setFirstRoadmapSlug(homeData.firstRoadmapSlug);
        setAllItems(homeData.items || []);
      } catch (err: any) {
        console.error('API error:', err);
        setError(`Failed to load data: ${err.response?.data?.message || err.message || 'Unknown error'}`);
        
        // Fallback to client-side tenant detection if API fails
        try {
          const fallbackTenantInfo = await getTenantInfoAsync();
          setTenantInfo(fallbackTenantInfo);
        } catch (fallbackErr) {
          console.error('Fallback tenant detection failed:', fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
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

  // Memoize expensive computations to prevent recalculation on every render
  const { completedItems, inProgressItems, plannedItems } = useMemo(() => {
    const completed = sortItemsByQuarter(allItems.filter(item => item.status === 'completed'));
    const inProgress = sortItemsByQuarter(allItems.filter(item => item.status === 'in-progress'));
    const planned = sortItemsByQuarter(allItems.filter(item => item.status === 'planned'));
    
    return {
      completedItems: completed,
      inProgressItems: inProgress,
      plannedItems: planned
    };
  }, [allItems]);

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
              <VoteButton itemId={item._id} itemStatus={item.status} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="home">
        <div className="hero">
          <div className="hero-content">
            <div className="hero-text">
              <div className="skeleton skeleton-title" style={{width: '60%', height: '48px', marginBottom: '16px'}} />
              <div className="skeleton skeleton-text" style={{width: '80%', height: '20px', marginBottom: '8px'}} />
              <div className="skeleton skeleton-text" style={{width: '70%', height: '20px', marginBottom: '24px'}} />
              <div className="skeleton skeleton-button" style={{width: '150px', height: '40px'}} />
            </div>
            <div className="hero-image">
              <div className="skeleton skeleton-image" style={{width: '400px', height: '300px', borderRadius: '8px'}} />
            </div>
          </div>
        </div>
        <section className="initiatives-container">
          <div className="ai-initiatives">
            <div className="skeleton skeleton-title" style={{width: '40%', height: '32px', marginBottom: '32px'}} />
            <div className="items-half-row-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="roadmap-item-card skeleton-card">
                  <div className="skeleton skeleton-text" style={{width: '70%', height: '24px', marginBottom: '12px'}} />
                  <div className="skeleton skeleton-text" style={{width: '100%', height: '16px', marginBottom: '8px'}} />
                  <div className="skeleton skeleton-text" style={{width: '80%', height: '16px', marginBottom: '16px'}} />
                  <div className="skeleton skeleton-badge" style={{width: '80px', height: '24px'}} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="home">
      <div className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>{heroTitle}</h1>
            <p>{productDescription}</p>
            {tenantInfo.isMainDomain ? (
              <div className="cta-buttons">
                <Link to="/register" className="cta-btn primary">Get Started</Link>
                <Link to="/login" className="cta-btn secondary">Sign In</Link>
              </div>
            ) : (
              firstRoadmapSlug && (
                <Link to={`/roadmap/${firstRoadmapSlug}`} className="cta-btn">View Full Roadmap</Link>
              )
            )}
          </div>
          <div className="hero-image">
            <img src="/hero-illustration.svg" alt="AI Roadmap Illustration" />
          </div>
        </div>
      </div>

      <section className="initiatives-container">
        <div className="ai-initiatives">
          <h2>{tenantInfo.isMainDomain ? 'How fore Works' : `${productName} Roadmap`}</h2>
        {error && <div className="error-message">{error}</div>}
        
        {allItems.length === 0 ? (
          <div className="roadmap-placeholder">
            {tenantInfo.isMainDomain ? (
              <div className="fore-features">
                <p>Transform how you communicate your product vision with customers.</p>
                <div className="feature-highlights">
                  <div className="highlight-card">
                    <h3>🗺️ Beautiful Roadmaps</h3>
                    <p>Create stunning, customer-facing roadmaps that showcase your product direction</p>
                  </div>
                  <div className="highlight-card">
                    <h3>🤖 AI-Powered Insights</h3>
                    <p>Get intelligent suggestions for roadmap content and customer communication</p>
                  </div>
                  <div className="highlight-card">
                    <h3>📊 Customer Feedback</h3>
                    <p>Collect and analyze customer votes and feedback on planned features</p>
                  </div>
                  <div className="highlight-card">
                    <h3>🎨 Custom Branding</h3>
                    <p>Match your brand with custom domains, colors, and styling</p>
                  </div>
                  <div className="highlight-card">
                    <h3>📈 Analytics & Insights</h3>
                    <p>Track engagement and understand what your customers really want</p>
                  </div>
                  <div className="highlight-card">
                    <h3>⚡ Easy Integration</h3>
                    <p>Embed roadmaps anywhere or use as standalone customer portals</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="tenant-roadmap-placeholder">
                <p>Our roadmap is being prepared. Check back soon for exciting updates!</p>
                <div className="coming-soon">
                  <h3>🚀 Coming Soon</h3>
                  <p>New features and improvements are on the way!</p>
                </div>
              </div>
            )}
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
