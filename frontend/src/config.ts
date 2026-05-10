/**
 * App Configuration
 * Centralized configuration for the mobile app
 */

// API Configuration
export const API_CONFIG = {
  // Development
  DEV: {
    baseURL: 'http://localhost:8000',
    timeout: 30000,
  },
  
  // Production
  PROD: {
    baseURL: 'https://api.coconutadvisory.com',
    timeout: 30000,
  },
};

// App Settings
export const APP_CONFIG = {
  name: 'Coconut Advisory',
  version: '1.0.0',
  description: 'Expert guidance for coconut farming',
};

// Chat Configuration
export const CHAT_CONFIG = {
  maxHistorySize: 100,
  maxMessageLength: 5000,
  autoSaveInterval: 5000, // 5 seconds
};

// UI Configuration
export const UI_CONFIG = {
  primaryColor: '#2d6a2d',
  secondaryColor: '#e8f5e9',
  accentColor: '#ff9800',
  darkModeEnabled: false,
};

// Feature Flags
export const FEATURES = {
  voiceInput: false,
  imageUpload: false,
  offline: true,
  chatHistory: true,
  sourceAttribution: true,
};

// Storage Keys
export const STORAGE_KEYS = {
  SETTINGS: 'app_settings',
  CHAT_HISTORY: 'chat_history',
  API_CONFIG: 'api_config',
  USER_PREFERENCES: 'user_preferences',
};

// Get current environment
export const getEnvironment = () => {
  return __DEV__ ? 'development' : 'production';
};

// Get API config for current environment
export const getApiConfig = () => {
  return getEnvironment() === 'development' ? API_CONFIG.DEV : API_CONFIG.PROD;
};
