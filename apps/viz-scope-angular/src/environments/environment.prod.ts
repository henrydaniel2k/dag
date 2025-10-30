/**
 * Production environment configuration
 */

export const environment = {
  production: true,
  apiUrl: '/api', // Production API URL
  enableDebugTools: false,
  logLevel: 'error' as const,
  gojsLicenseKey: '', // Add GoJS license key
};
