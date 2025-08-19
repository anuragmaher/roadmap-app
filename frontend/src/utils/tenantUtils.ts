export interface TenantInfo {
  isMainDomain: boolean;
  isSubdomain: boolean;
  subdomain: string | null;
  hostname: string;
}

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
  
  // Check if we're on localhost for development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return {
      isMainDomain: true,
      isSubdomain: false,
      subdomain: null,
      hostname
    };
  }
  
  // Check if we're on the main forehq.com domain
  if (hostname === 'forehq.com' || hostname === 'www.forehq.com') {
    return {
      isMainDomain: true,
      isSubdomain: false,
      subdomain: null,
      hostname
    };
  }
  
  // Check if we're on a subdomain of forehq.com
  if (hostname.endsWith('.forehq.com')) {
    const subdomain = hostname.replace('.forehq.com', '');
    // Skip www as it's considered main domain
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
  
  // Default to main domain for unknown domains
  return {
    isMainDomain: true,
    isSubdomain: false,
    subdomain: null,
    hostname
  };
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
