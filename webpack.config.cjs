const path = require('path');
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async (env, argv) => {
  const mode = argv.mode || env.mode || 'production';
  const config = await createExpoWebpackConfigAsync({ ...env, mode }, argv);

  config.output = config.output || {};
  config.output.path = path.resolve(__dirname, 'dist');

  config.resolve = config.resolve || {};
  config.resolve.fallback = {
    ...(config.resolve.fallback || {}),
    path: require.resolve('path-browserify'),
    fs: false,
    crypto: false,
  };

  config.module.rules.push({
    test: /sql-wasm\.wasm$/,
    type: 'asset/resource',
  });

  return config;
};
