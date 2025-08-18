import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { checkSubdomainAvailability } from '../services/auth';

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
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [subdomainInfo, setSubdomainInfo] = useState<any>(null);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const { register, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
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

    setLoading(true);

    try {
      await register(email, password, companyName, companySize);
      // For now, just navigate to dashboard - we'll handle subdomain redirect later
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
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
      <div className="auth-form">
        <h2>Register</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
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
              <div className="subdomain-checking">Checking availability...</div>
            )}
            {subdomainInfo && (
              <div className={`subdomain-preview ${subdomainInfo.isAvailable ? 'available' : 'unavailable'}`}>
                <div className="subdomain-url">
                  {subdomainInfo.subdomain}.yourdomain.com
                </div>
                <div className={`availability-status ${subdomainInfo.isAvailable ? 'available' : 'unavailable'}`}>
                  {subdomainInfo.isAvailable ? '✓ Available' : '✗ Not available'}
                </div>
                {!subdomainInfo.isAvailable && subdomainInfo.suggestions.length > 0 && (
                  <div className="suggestions">
                    <p>Try these alternatives:</p>
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
          
          <div className="form-group">
            <label htmlFor="companySize">Company Size</label>
            <select
              id="companySize"
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
              required
            >
              <option value="">Select company size</option>
              <option value="0-10">0-10 employees</option>
              <option value="10-100">10-100 employees</option>
              <option value="100+">100+ employees</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        
        <p className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
