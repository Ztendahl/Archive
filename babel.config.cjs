module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Keep plugins minimal unless you need extras like reanimated or module-resolver
    // plugins: ['react-native-reanimated/plugin'],
  };
};
