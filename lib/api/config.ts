// API Configuration
export const API_CONFIG = {
  // Toggle between proxy and direct mode
  useProxy: false, // Direct API to avoid proxy issues
  
  proxyBase: '/api/gradio',
  directBase: 'https://ace-step-ace-step-v1-5.hf.space/gradio_api',
  
  // Polling configuration
  pollInterval: 3000, // Poll every 3 seconds (reduced API load)
  maxPollAttempts: 300, // 300 * 3s = 15 minutes (for long audio generation)
  
  // Request timeout
  timeout: 900000, // 15 minutes
}

export function getAPIBase(): string {
  return API_CONFIG.useProxy ? API_CONFIG.proxyBase : API_CONFIG.directBase
}
