/**
 * Centralized Configuration
 * 
 * This module provides access to environment variables and app configuration.
 * All environment variables should be accessed through this module to ensure
 * they work correctly in both development and production builds.
 */

import Constants from 'expo-constants';

/**
 * Get configuration values from Expo Constants
 * These are embedded at build time from app.config.js
 */
const getConfig = () => {
  const extra = Constants.expoConfig?.extra || {};
  
  return {
    apiBaseUrl: extra.apiBaseUrl || 'https://fobssms.com/api',
    webBaseUrl: extra.webBaseUrl || 'https://fobssms.com',
  };
};

// Export the configuration as a constant
export const Config = getConfig();

// Log configuration in development for debugging
if (__DEV__) {
  console.log('App Configuration:', Config);
}

export default Config;
