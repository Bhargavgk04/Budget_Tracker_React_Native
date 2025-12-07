module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      "nativewind/babel",
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./app'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './app',
            '@/components': './app/components',
            '@/screens': './app/screens',
            '@/services': './app/services',
            '@/utils': './app/utils',
            '@/types': './app/types',
            '@/contexts': './app/contexts',
            '@/hooks': './app/hooks',
            '@/config': './app/config',
            '@/theme': './app/theme',
            '@/constants': './app/constants',
          },
        },
      ],
    ],
  };
};