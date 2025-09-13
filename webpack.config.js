import createExpoWebpackConfigAsync from '@expo/webpack-config';

export default async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  config.module = config.module || {};
  config.module.rules = config.module.rules || [];
  config.module.rules.push({
    test: /sql-wasm\.wasm$/,
    type: 'asset/resource',
  });
  return config;
}
