import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { checkSubdomainAvailability } from '../services/auth';
import axios from 'axios';

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [subdomainInfo, setSubdomainInfo] = useState<any>(null);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!firstName.trim()) {
      setError('First name is required');
      return;
    }

    if (!lastName.trim()) {
      setError('Last name is required');
      return;
    }

    if (!companyName.trim()) {
      setError('Company name is required');
      return;
    }

    if (!companySize) {
      setError('Company size is required');
      return;
    }

    if (!role.trim()) {
      setError('Role is required');
      return;
    }

    setLoading(true);

    try {
      await axios.post('/api/beta', {
        email,
        firstName,
        lastName,
        companyName,
        companySize,
        role
      });
      
      setSuccess('Thank you for your interest! We\'ve added you to our beta program and will contact you soon with early access.');
      
      // Clear form
      setEmail('');
      setFirstName('');
      setLastName('');
      setCompanyName('');
      setCompanySize('');
      setRole('');
      setSubdomainInfo(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to join beta program. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Debounced subdomain check
  const debouncedCheckSubdomain = useCallback(
    debounce(async (name: string) => {
      if (name.trim()) {
        setCheckingSubdomain(true);
        try {
          const result = await checkSubdomainAvailability(name);
          setSubdomainInfo(result);
        } catch (error) {
          console.error('Error checking subdomain:', error);
        } finally {
          setCheckingSubdomain(false);
        }
      } else {
        setSubdomainInfo(null);
      }
    }, 500),
    []
  );

  useEffect(() => {
    debouncedCheckSubdomain(companyName);
  }, [companyName, debouncedCheckSubdomain]);

  return (
    <div className="auth-container">
      <div className="auth-form" style={{ maxWidth: '500px' }}>
        <h2>Join Our Closed Beta</h2>
        <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-secondary)' }}>
          We're currently in closed beta. Submit your details to get early access to our roadmap platform.
        </p>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        {!success && (
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Your first name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Your last name"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Work Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@company.com"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="companyName">Company Name</label>
              <input
                type="text"
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter your company name"
                required
              />
              {checkingSubdomain && (
                <div className="subdomain-checking">Checking subdomain availability...</div>
              )}
              {subdomainInfo && (
                <div className={`subdomain-preview ${subdomainInfo.isAvailable ? 'available' : 'unavailable'}`}>
                  <div className="subdomain-url">
                    {subdomainInfo.subdomain}.forehq.com
                  </div>
                  <div className={`availability-status ${subdomainInfo.isAvailable ? 'available' : 'unavailable'}`}>
                    {subdomainInfo.isAvailable ? '✓ Subdomain Available' : '✗ Subdomain Taken'}
                  </div>
                  {!subdomainInfo.isAvailable && subdomainInfo.suggestions.length > 0 && (
                    <div className="suggestions">
                      <p>Alternative suggestions:</p>
                      <div className="suggestion-buttons">
                        {subdomainInfo.suggestions.slice(0, 3).map((suggestion: string) => (
                          <button
                            key={suggestion}
                            type="button"
                            className="suggestion-btn"
                            onClick={() => setCompanyName(suggestion.replace(/-/g, ' '))}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="role">Your Role</label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="">Select your role</option>
                  <option value="Product Manager">Product Manager</option>
                  <option value="Engineering Manager">Engineering Manager</option>
                  <option value="CEO/Founder">CEO/Founder</option>
                  <option value="CTO">CTO</option>
                  <option value="VP of Product">VP of Product</option>
                  <option value="Head of Engineering">Head of Engineering</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="companySize">Company Size</label>
                <select
                  id="companySize"
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  required
                >
                  <option value="">Select company size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-1000">201-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>
            </div>
            
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Joining beta...' : 'Join Beta'}
            </button>
          </form>
        )}
        
        <p className="auth-link">
          Already have access? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
