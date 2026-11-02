/**
 * API Base URL Resolver
 * Allows local development to seamlessly proxy/fetch from live production
 * when VITE_USE_LIVE_API=true or VITE_API_URL is configured in .env.local.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const liveApiEnv = (import.meta as any).env.VITE_USE_LIVE_API;
    const customApiUrl = (import.meta as any).env.VITE_API_BASE_URL;
    
    if (customApiUrl) {
      return customApiUrl.replace(/\/+$/, '');
    }
    
    if (liveApiEnv === 'true' || liveApiEnv === true) {
      return 'https://leafcurt.com/api';
    }
  }
  return '/api';
}
