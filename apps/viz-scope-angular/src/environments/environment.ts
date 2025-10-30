/**
 * Development environment configuration
 */

export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api', // Backend API URL (future)
  enableDebugTools: true,
  logLevel: 'debug' as const,
  gojsLicenseKey: '', // Add GoJS license key if available
};
