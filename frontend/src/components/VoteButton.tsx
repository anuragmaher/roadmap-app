import React, { useState, useEffect } from 'react';
import { voteApi } from '../services/api';

interface VoteButtonProps {
  itemId: string;
  itemStatus: 'planned' | 'in-progress' | 'completed' | 'cancelled';
}

const VoteButton: React.FC<VoteButtonProps> = ({ itemId, itemStatus }) => {
  const [email, setEmail] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [isHighDemand, setIsHighDemand] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [error, setError] = useState('');

  const loadVoteData = async () => {
    try {
      const voteData = await voteApi.getVotes(itemId);
      setIsHighDemand(voteData.isHighDemand);
    } catch (error) {
      console.error('Failed to load vote data:', error);
    }
  };

  const checkUserVote = async (userEmail: string) => {
    try {
      const { hasVoted: voted } = await voteApi.checkUserVote(itemId, userEmail);
      setHasVoted(voted);
    } catch (error) {
      console.error('Failed to check user vote:', error);
    }
  };

  useEffect(() => {
    if (itemStatus !== 'completed') {
      loadVoteData();
    }
  }, [itemId, itemStatus]);

  useEffect(() => {
    if (itemStatus !== 'completed') {
      const savedEmail = localStorage.getItem('voterEmail');
      if (savedEmail) {
        setEmail(savedEmail);
        checkUserVote(savedEmail);
      }
      
      // Check if user has voted for this specific item in localStorage
      const votedItems = JSON.parse(localStorage.getItem('votedItems') || '[]');
      if (votedItems.includes(itemId)) {
        setHasVoted(true);
      }
    }
  }, [itemId, itemStatus]);

  // Don't show voting for completed items
  if (itemStatus === 'completed') {
    return null;
  }

  const handleVote = async () => {
    if (!email) {
      setShowEmailInput(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (hasVoted) {
        const result = await voteApi.removeVote(itemId, email);
        setHasVoted(false);
        setIsHighDemand(result.isHighDemand);
        
        // Remove from localStorage
        const votedItems = JSON.parse(localStorage.getItem('votedItems') || '[]');
        const updatedVotedItems = votedItems.filter((id: string) => id !== itemId);
        localStorage.setItem('votedItems', JSON.stringify(updatedVotedItems));
      } else {
        const result = await voteApi.vote(itemId, email);
        setHasVoted(true);
        setIsHighDemand(result.isHighDemand);
        localStorage.setItem('voterEmail', email);
        
        // Add to localStorage
        const votedItems = JSON.parse(localStorage.getItem('votedItems') || '[]');
        if (!votedItems.includes(itemId)) {
          votedItems.push(itemId);
          localStorage.setItem('votedItems', JSON.stringify(votedItems));
        }
      }
      setShowEmailInput(false);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to vote');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      handleVote();
    }
  };

  return (
    <div className="vote-container">
      {isHighDemand && (
        <div className="demand-indicator">
          🔥 High demand
        </div>
      )}
      
      {showEmailInput && !hasVoted ? (
        <form onSubmit={handleEmailSubmit} className="email-form-modal">
          <div className="email-form-content">
            <h4>Get notified when this feature is ready!</h4>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="email-input"
              required
            />
            <div className="email-form-actions">
              <button 
                type="submit" 
                className="vote-btn primary"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Notify me'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowEmailInput(false)}
                className="vote-btn secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      ) : (
        <button
          onClick={hasVoted ? handleVote : () => setShowEmailInput(true)}
          className={`vote-btn-icon ${hasVoted ? 'voted' : 'primary'}`}
          disabled={loading}
          title={hasVoted ? "You'll be notified when ready" : "Get notified when ready"}
        >
          {loading ? (
            <span className="loading-spinner">⏳</span>
          ) : hasVoted ? (
            <span className="vote-icon">✓</span>
          ) : (
            <span className="vote-icon">🔔</span>
          )}
          <span className="vote-text">
            {hasVoted ? "You'll be notified" : "Notify me"}
          </span>
        </button>
      )}
      
      {error && <div className="vote-error-message">{error}</div>}
    </div>
  );
};

export default VoteButton;