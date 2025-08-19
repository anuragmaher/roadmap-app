import { tenantApi } from '../services/api';

export interface TenantInfo {
  isMainDomain: boolean;
  isSubdomain: boolean;
  subdomain: string | null;
  hostname: string;
  isCustomDomain?: boolean;
}

// Cache for tenant info to avoid multiple API calls
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
  
  // For development/localhost, return default behavior
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return {
      isMainDomain: false, // Changed to false so it loads roadmap data for hiver
      isSubdomain: true,   // Changed to true so it loads roadmap data for hiver
      subdomain: 'hiver',  // Default to hiver for development
      hostname
    };
  }
  
  // Fallback for client-side rendering before API call completes
  // This will be replaced by getTenantInfoAsync results
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
  
  // For unknown domains, assume they could be custom domains
  // The API call will provide the correct information
  return {
    isMainDomain: false,
    isSubdomain: false,
    isCustomDomain: true,
    subdomain: null,
    hostname
  };
};

// Async function to get tenant info from API
export const getTenantInfoAsync = async (): Promise<TenantInfo> => {
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
