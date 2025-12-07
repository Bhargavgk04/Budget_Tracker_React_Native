const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add custom resolver for path aliases
config.resolver.alias = {
  '@': path.resolve(__dirname, 'app'),
  '@/components': path.resolve(__dirname, 'app/components'),
  '@/screens': path.resolve(__dirname, 'app/screens'),
  '@/services': path.resolve(__dirname, 'app/services'),
  '@/utils': path.resolve(__dirname, 'app/utils'),
  '@/types': path.resolve(__dirname, 'app/types'),
  '@/contexts': path.resolve(__dirname, 'app/contexts'),
  '@/hooks': path.resolve(__dirname, 'app/hooks'),
};

// Also add to resolver.modules for better compatibility
config.resolver.modules = ['node_modules', 'app'];

module.exports = config;
