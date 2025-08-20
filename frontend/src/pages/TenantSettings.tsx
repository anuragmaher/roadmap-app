import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { tenantApi } from '../services/api';

interface TenantUser {
  _id: string;
  email: string;
  name?: string;
  role: string;
  joinedAt: string;
  lastActive?: string;
  status: 'active' | 'invited' | 'suspended';
}

interface TenantSettings {
  name: string;
  subdomain: string;
  settings: {
    customDomain?: string;
    logo?: string;
    favicon?: string;
    primaryColor: string;
    secondaryColor: string;
    theme: string;
    allowPublicVoting: boolean;
    emailNotifications: boolean;
    customCSS?: string;
    contactEmail?: string;
    supportUrl?: string;
    timezone: string;
  };
  plan: string;
  status: string;
  companySize: string;
}

const TenantSettings: React.FC = () => {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  
  // Users management state
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [showInviteLink, setShowInviteLink] = useState(false);

  useEffect(() => {
    fetchTenantSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchTenantSettings = async () => {
    try {
      const response = await tenantApi.getSettings();
      setTenant(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load tenant settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await tenantApi.updateSettings(tenant);
      setTenant(response.data);
      setSuccess('Settings updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (path: string, value: any) => {
    if (!tenant) return;

    const keys = path.split('.');
    const updated = { ...tenant };
    let current: any = updated;

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    setTenant(updated);
  };

  // User management functions
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await tenantApi.getUsers();
      setUsers(response.data);
    } catch (err: any) {
      setError(`Failed to load users: ${err.response?.data?.message || err.message}`);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    setError('');
    setSuccess('');

    try {
      const response = await tenantApi.inviteUser(inviteEmail.trim());
      setSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      fetchUsers(); // Refresh the users list
    } catch (err: any) {
      setError(`Failed to send invitation: ${err.response?.data?.message || err.message}`);
    } finally {
      setInviting(false);
    }
  };

  const handleGenerateInviteLink = async () => {
    setError('');
    try {
      const response = await tenantApi.generateInviteLink();
      setInviteLink(response.data.inviteLink);
      setShowInviteLink(true);
      setSuccess('Invite link generated successfully');
    } catch (err: any) {
      setError(`Failed to generate invite link: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user?')) return;
    
    try {
      await tenantApi.removeUser(userId);
      setSuccess('User removed successfully');
      fetchUsers(); // Refresh the users list
    } catch (err: any) {
      setError(`Failed to remove user: ${err.response?.data?.message || err.message}`);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setSuccess('Invite link copied to clipboard');
  };

  if (loading) return <div className="loading">Loading tenant settings...</div>;
  if (!tenant) return <div className="error">Failed to load tenant settings</div>;

  return (
    <div className="tenant-settings">
      <div className="settings-header">
        <h1>Tenant Settings</h1>
        <p>Configure your organization's settings and branding</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="settings-tabs">
        <button 
          className={`tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        <button 
          className={`tab ${activeTab === 'branding' ? 'active' : ''}`}
          onClick={() => setActiveTab('branding')}
        >
          Branding
        </button>
        <button 
          className={`tab ${activeTab === 'domain' ? 'active' : ''}`}
          onClick={() => setActiveTab('domain')}
        >
          Domain
        </button>
        <button 
          className={`tab ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          Preferences
        </button>
        <button 
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
      </div>

      <form onSubmit={handleSave} className="settings-form">
        {activeTab === 'general' && (
          <div className="tab-content">
            <h3>General Information</h3>
            
            <div className="form-group">
              <label htmlFor="name">Organization Name</label>
              <input
                type="text"
                id="name"
                value={tenant.name}
                onChange={(e) => updateSetting('name', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="subdomain">Subdomain</label>
              <input
                type="text"
                id="subdomain"
                value={tenant.subdomain}
                onChange={(e) => updateSetting('subdomain', e.target.value)}
                required
                disabled
              />
              <small>Contact support to change your subdomain</small>
            </div>

            <div className="form-group">
              <label htmlFor="companySize">Company Size</label>
              <select
                id="companySize"
                value={tenant.companySize}
                onChange={(e) => updateSetting('companySize', e.target.value)}
              >
                <option value="0-10">0-10 employees</option>
                <option value="10-100">10-100 employees</option>
                <option value="100+">100+ employees</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="contactEmail">Contact Email</label>
              <input
                type="email"
                id="contactEmail"
                value={tenant.settings.contactEmail || ''}
                onChange={(e) => updateSetting('settings.contactEmail', e.target.value)}
                placeholder="contact@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="supportUrl">Support URL</label>
              <input
                type="url"
                id="supportUrl"
                value={tenant.settings.supportUrl || ''}
                onChange={(e) => updateSetting('settings.supportUrl', e.target.value)}
                placeholder="https://support.example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="timezone">Timezone</label>
              <select
                id="timezone"
                value={tenant.settings.timezone}
                onChange={(e) => updateSetting('settings.timezone', e.target.value)}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Asia/Shanghai">Shanghai</option>
                <option value="Australia/Sydney">Sydney</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'branding' && (
          <div className="tab-content">
            <h3>Branding & Appearance</h3>
            
            <div className="form-group">
              <label htmlFor="logo">Logo URL</label>
              <input
                type="url"
                id="logo"
                value={tenant.settings.logo || ''}
                onChange={(e) => updateSetting('settings.logo', e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="form-group">
              <label htmlFor="favicon">Favicon URL</label>
              <input
                type="url"
                id="favicon"
                value={tenant.settings.favicon || ''}
                onChange={(e) => updateSetting('settings.favicon', e.target.value)}
                placeholder="https://example.com/favicon.ico"
              />
            </div>

            <div className="color-group">
              <div className="form-group">
                <label htmlFor="primaryColor">Primary Color</label>
                <div className="color-input">
                  <input
                    type="color"
                    id="primaryColor"
                    value={tenant.settings.primaryColor}
                    onChange={(e) => updateSetting('settings.primaryColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={tenant.settings.primaryColor}
                    onChange={(e) => updateSetting('settings.primaryColor', e.target.value)}
                    pattern="^#[0-9a-fA-F]{6}$"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="secondaryColor">Secondary Color</label>
                <div className="color-input">
                  <input
                    type="color"
                    id="secondaryColor"
                    value={tenant.settings.secondaryColor}
                    onChange={(e) => updateSetting('settings.secondaryColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={tenant.settings.secondaryColor}
                    onChange={(e) => updateSetting('settings.secondaryColor', e.target.value)}
                    pattern="^#[0-9a-fA-F]{6}$"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="theme">Default Theme</label>
              <select
                id="theme"
                value={tenant.settings.theme}
                onChange={(e) => updateSetting('settings.theme', e.target.value)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (system)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="customCSS">Custom CSS</label>
              <textarea
                id="customCSS"
                value={tenant.settings.customCSS || ''}
                onChange={(e) => updateSetting('settings.customCSS', e.target.value)}
                placeholder="/* Custom CSS styles */
body {
  font-family: 'Your Font', sans-serif;
}"
                rows={10}
              />
              <small>Add custom CSS to override default styles</small>
            </div>
          </div>
        )}

        {activeTab === 'domain' && (
          <div className="tab-content">
            <h3>Domain Settings</h3>
            
            <div className="form-group">
              <label htmlFor="customDomain">Custom Domain</label>
              <input
                type="text"
                id="customDomain"
                value={tenant.settings.customDomain || ''}
                onChange={(e) => updateSetting('settings.customDomain', e.target.value)}
                placeholder="company.forehq.com"
              />
              <small>Enter your custom domain without http:// or www.</small>
            </div>

            <div className="domain-info">
              <h4>Current Access URLs:</h4>
              <ul>
                <li><strong>Subdomain:</strong> {tenant.subdomain}.forehq.com</li>
                {tenant.settings.customDomain && (
                  <li><strong>Custom Domain:</strong> {tenant.settings.customDomain}</li>
                )}
              </ul>
            </div>

            {tenant.settings.customDomain && (
              <div className="domain-setup">
                <h4>Domain Setup Instructions:</h4>
                <ol>
                  <li>Point your domain's DNS to our servers</li>
                  <li>Add a CNAME record: <code>www CNAME yourdomain.com</code></li>
                  <li>Add an A record: <code>@ A 1.2.3.4</code></li>
                </ol>
                <small>Contact support for detailed setup instructions</small>
              </div>
            )}
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="tab-content">
            <h3>Preferences</h3>
            
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={tenant.settings.allowPublicVoting}
                  onChange={(e) => updateSetting('settings.allowPublicVoting', e.target.checked)}
                />
                Allow public voting on roadmap items
              </label>
            </div>

            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={tenant.settings.emailNotifications}
                  onChange={(e) => updateSetting('settings.emailNotifications', e.target.checked)}
                />
                Enable email notifications
              </label>
            </div>

            <div className="plan-info">
              <h4>Plan Information</h4>
              <p><strong>Current Plan:</strong> {tenant.plan}</p>
              <p><strong>Status:</strong> {tenant.status}</p>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="tab-content">
            <h3>Team Members</h3>
            <p>Manage users who have access to your roadmap and can edit content.</p>
            
            {/* Invite by Email */}
            <div className="invite-section">
              <h4>Invite by Email</h4>
              <form onSubmit={handleInviteUser} className="invite-form">
                <div className="form-row">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email address"
                    required
                    disabled={inviting}
                  />
                  <button type="submit" className="btn btn-primary" disabled={inviting}>
                    {inviting ? 'Sending...' : 'Send Invite'}
                  </button>
                </div>
              </form>
            </div>

            {/* Generate Invite Link */}
            <div className="invite-section">
              <h4>Invite Link</h4>
              <p>Generate a link that anyone can use to join your team.</p>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleGenerateInviteLink}
              >
                Generate Invite Link
              </button>
              
              {showInviteLink && inviteLink && (
                <div className="invite-link-container">
                  <div className="invite-link-display">
                    <input 
                      type="text" 
                      value={inviteLink} 
                      readOnly 
                      className="invite-link-input"
                    />
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={copyInviteLink}
                    >
                      Copy
                    </button>
                  </div>
                  <small>Share this link with team members to join your organization.</small>
                </div>
              )}
            </div>

            {/* Users List */}
            <div className="users-section">
              <h4>Current Team Members</h4>
              {usersLoading ? (
                <div className="loading">Loading users...</div>
              ) : users.length === 0 ? (
                <p>No team members yet. Invite someone to get started!</p>
              ) : (
                <div className="users-table">
                  <div className="users-header">
                    <div className="user-email">Email</div>
                    <div className="user-role">Role</div>
                    <div className="user-status">Status</div>
                    <div className="user-joined">Joined</div>
                    <div className="user-actions">Actions</div>
                  </div>
                  {users.map((userItem) => (
                    <div key={userItem._id} className="user-row">
                      <div className="user-email">
                        {userItem.email}
                        {userItem.name && <span className="user-name">({userItem.name})</span>}
                      </div>
                      <div className="user-role">
                        <span className="role-badge">{userItem.role}</span>
                      </div>
                      <div className="user-status">
                        <span className={`status-badge ${userItem.status}`}>
                          {userItem.status}
                        </span>
                      </div>
                      <div className="user-joined">
                        {new Date(userItem.joinedAt).toLocaleDateString()}
                      </div>
                      <div className="user-actions">
                        {userItem.email !== user?.email && (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRemoveUser(userItem._id)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="save-btn" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TenantSettings;
