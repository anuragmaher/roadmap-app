import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { roadmapApi } from '../services/api';
import { Roadmap } from '../types';
import { getAvailableQuarters } from '../utils/quarters';

const Home: React.FC = () => {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPublicRoadmaps = async () => {
      try {
        const data = await roadmapApi.getPublic();
        console.log('API response:', data); // Debug log
        
        // Ensure data is an array
        if (Array.isArray(data)) {
          setRoadmaps(data);
        } else {
          console.error('API did not return an array:', data);
          setError('Invalid response format from server');
          setRoadmaps([]);
        }
      } catch (err: any) {
        console.error('API error:', err);
        setError(`Failed to load roadmaps: ${err.response?.data?.message || err.message || 'Unknown error'}`);
        setRoadmaps([]);
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
        <h1>Hiver AI Roadmap</h1>
        <p>Explore our AI-powered initiatives and upcoming features for customer support excellence</p>
        <Link to="/roadmap/hiver-ai" className="cta-btn">View Full Roadmap</Link>
      </div>

      <div className="ai-initiatives">
        <h2>AI Initiatives & Features</h2>
        {error && <div className="error-message">{error}</div>}
        
        {roadmaps.length === 0 ? (
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
          <div className="roadmap-grid">
            {roadmaps.filter(roadmap => 
              roadmap.title.toLowerCase().includes('hiver') || 
              roadmap.title.toLowerCase().includes('ai') ||
              roadmap.slug.includes('hiver')
            ).map((roadmap) => (
              <div key={roadmap._id} className="roadmap-card">
                <h3>{roadmap.title}</h3>
                <p>{roadmap.description}</p>
                <div className="roadmap-meta">
                  <span>Team: Hiver AI & Product</span>
                  <div className="quarter-links">
                    {getAvailableQuarters().map(quarter => (
                      <Link 
                        key={quarter.value}
                        to={`/roadmap/${roadmap.slug}/${quarter.value.toLowerCase()}`}
                      >
                        {quarter.label}
                      </Link>
                    ))}
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