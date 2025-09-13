import path from 'node:path';
import { fileURLToPath } from 'node:url';
import createExpoWebpackConfigAsync from '@expo/webpack-config';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  config.plugins = config.plugins || [];
  config.plugins.push(
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'node_modules/sql.js/dist/sql-wasm.wasm'),
          to: 'sql-wasm.wasm',
        },
      ],
    })
  );
  return config;
}
