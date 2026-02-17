// API Configuration
export const API_CONFIG = {
  // Toggle between proxy and direct mode
  useProxy: true, // Set to false to use direct API calls (may have CORS issues)
  
  proxyBase: '/api/gradio',
  directBase: 'https://ace-step-ace-step-v1-5.hf.space/gradio_api',
  
  // Polling configuration
  pollInterval: 500, // ms
  maxPollAttempts: 600, // 5 minutes
  
  // Request timeout
  timeout: 300000, // 5 minutes
}

export function getAPIBase(): string {
  return API_CONFIG.useProxy ? API_CONFIG.proxyBase : API_CONFIG.directBase
}
