import { tenantApi } from '../services/api';

export interface TenantInfo {
  isMainDomain: boolean;
  isSubdomain: boolean;
  subdomain: string | null;
  hostname: string;
  isCustomDomain?: boolean;
}

// Lightweight cache for tenant info to avoid multiple API calls within the same page load
let tenantInfoCache: TenantInfo | null = null;
let tenantInfoPromise: Promise<TenantInfo> | null = null;

export const getTenantInfo = (): TenantInfo => {
  const hostname = window.location.hostname;
  
  // Check for debug parameter to simulate tenants
  const urlParams = new URLSearchParams(window.location.search);
  const debugTenant = urlParams.get('debug_tenant');
  
  if (debugTenant) {
    return {
      isMainDomain: false,
      isSubdomain: true,
      subdomain: debugTenant,
      hostname: `${debugTenant}.forehq.com`
    };
  }
  
  // For development/localhost, return main domain behavior
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return {
      isMainDomain: true,
      isSubdomain: false,
      subdomain: null,
      hostname
    };
  }
  
  // Main forehq.com domain should always be treated as main domain
  if (hostname === 'forehq.com' || hostname === 'www.forehq.com') {
    return {
      isMainDomain: true,
      isSubdomain: false,
      subdomain: null,
      hostname
    };
  }
  
  if (hostname.endsWith('.forehq.com')) {
    const subdomain = hostname.replace('.forehq.com', '');
    if (subdomain === 'www') {
      return {
        isMainDomain: true,
        isSubdomain: false,
        subdomain: null,
        hostname
      };
    }
    
    return {
      isMainDomain: false,
      isSubdomain: true,
      subdomain,
      hostname
    };
  }
  
  // For unknown domains, check if they're likely custom domains
  // Common patterns that indicate it's NOT the main forehq domain
  if (!hostname.includes('forehq.com') && 
      !hostname.includes('vercel.app') && 
      !hostname.includes('netlify.app') &&
      hostname !== 'localhost' && 
      hostname !== '127.0.0.1') {
    // This is likely a custom domain, assume it's a tenant
    // For hiver-ai.com specifically, we know it's hiver
    if (hostname === 'hiver-ai.com' || hostname === 'www.hiver-ai.com') {
      return {
        isMainDomain: false,
        isSubdomain: false,
        isCustomDomain: true,
        subdomain: 'hiver',
        hostname
      };
    }
    
    // For other custom domains, assume they're tenant domains
    // The API call will provide the correct subdomain
    return {
      isMainDomain: false,
      isSubdomain: false,
      isCustomDomain: true,
      subdomain: null, // Will be updated by API
      hostname
    };
  }
  
  // Default to main domain for unknown cases
  return {
    isMainDomain: true,
    isSubdomain: false,
    subdomain: null,
    hostname
  };
};

// Async function to get tenant info from API
export const getTenantInfoAsync = async (): Promise<TenantInfo> => {
  // Check for debug parameter first - it should always override API
  const urlParams = new URLSearchParams(window.location.search);
  const debugTenant = urlParams.get('debug_tenant');
  
  if (debugTenant) {
    const debugInfo = {
      isMainDomain: false,
      isSubdomain: true,
      subdomain: debugTenant,
      hostname: `${debugTenant}.forehq.com`
    };
    tenantInfoCache = debugInfo; // Cache debug result
    return debugInfo;
  }
  
  // Return cached result if available
  if (tenantInfoCache) {
    return tenantInfoCache;
  }
  
  // Return existing promise if already fetching
  if (tenantInfoPromise) {
    return tenantInfoPromise;
  }
  
  // Create new promise to fetch tenant info
  tenantInfoPromise = (async () => {
    try {
      const response = await tenantApi.getInfo();
      const data = response.data;
      
      const tenantInfo: TenantInfo = {
        isMainDomain: data.domainInfo.isMainDomain,
        isSubdomain: data.domainInfo.isSubdomain,
        isCustomDomain: data.domainInfo.isCustomDomain,
        subdomain: data.subdomain,
        hostname: data.domainInfo.hostname
      };
      
      // Cache the result
      tenantInfoCache = tenantInfo;
      return tenantInfo;
    } catch (error) {
      console.error('Failed to fetch tenant info:', error);
      // Fall back to client-side detection
      const fallback = getTenantInfo();
      tenantInfoCache = fallback;
      return fallback;
    } finally {
      // Clear the promise so subsequent calls can create a new one if needed
      tenantInfoPromise = null;
    }
  })();
  
  return tenantInfoPromise;
};

export const getProductName = (tenantInfo?: TenantInfo): string => {
  const tenant = tenantInfo || getTenantInfo();
  
  if (tenant.isMainDomain) {
    return 'fore';
  }
  
  // Return capitalized subdomain name for tenant branding
  if (tenant.subdomain) {
    return tenant.subdomain.charAt(0).toUpperCase() + tenant.subdomain.slice(1);
  }
  
  // For custom domains without subdomain info yet, try to infer from hostname
  if (tenant.isCustomDomain) {
    // For known custom domains, return the expected brand name
    if (tenant.hostname === 'hiver-ai.com' || tenant.hostname === 'www.hiver-ai.com') {
      return 'Hiver';
    }
    // For unknown custom domains, show loading state
    return '...'; // Will be updated when API call completes
  }
  
  return 'fore';
};

export const getProductDescription = (tenantInfo?: TenantInfo): string => {
  const tenant = tenantInfo || getTenantInfo();
  
  if (tenant.isMainDomain) {
    return 'Create customer-facing roadmaps powered by AI. Help your customers understand your product direction and gather valuable feedback.';
  }
  
  // For tenant subdomains, use company-specific messaging
  const companyName = getProductName(tenant);
  return `Explore ${companyName}'s product roadmap and upcoming features. See what's planned, in progress, and recently completed.`;
};

export const getHeroTitle = (tenantInfo?: TenantInfo): string => {
  const tenant = tenantInfo || getTenantInfo();
  
  if (tenant.isMainDomain) {
    return 'Build Customer-Facing Roadmaps with AI';
  }
  
  const companyName = getProductName(tenant);
  return `${companyName} Product Roadmap`;
};
