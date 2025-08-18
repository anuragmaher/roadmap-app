const { Tenant } = require('../models');

const generateSubdomain = (companyName) => {
  return companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50); // Limit length
};

const checkSubdomainAvailability = async (req, res) => {
  try {
    const { companyName } = req.body;
    
    if (!companyName) {
      return res.status(400).json({ message: 'Company name is required' });
    }

    let subdomain = generateSubdomain(companyName);
    const originalSubdomain = subdomain;
    
    // Check if subdomain already exists
    let existingTenant = await Tenant.findOne({ subdomain });
    let isAvailable = !existingTenant;
    let suggestions = [];
    
    if (!isAvailable) {
      // Generate suggestions
      for (let i = 1; i <= 3; i++) {
        const suggestion = `${originalSubdomain}-${i}`;
        const exists = await Tenant.findOne({ subdomain: suggestion });
        if (!exists) {
          suggestions.push(suggestion);
        }
      }
      
      // Add random suggestions
      const randomSuffixes = ['inc', 'co', 'app', 'team'];
      for (const suffix of randomSuffixes) {
        const suggestion = `${originalSubdomain}-${suffix}`;
        const exists = await Tenant.findOne({ subdomain: suggestion });
        if (!exists && suggestions.length < 5) {
          suggestions.push(suggestion);
        }
      }
    }

    res.json({
      subdomain: originalSubdomain,
      isAvailable,
      suggestions: suggestions.slice(0, 5),
      preview: `${originalSubdomain}.yourdomain.com`
    });
  } catch (error) {
    console.error('Check subdomain error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  checkSubdomainAvailability,
  generateSubdomain
};