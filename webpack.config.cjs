const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env = {}, argv = {}) => {
  const mode = argv.mode || env.mode || 'production';

  return {
    mode,
    entry: path.resolve(__dirname, 'src/index.tsx'),
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
      extensions: ['.web.ts', '.web.tsx', '.ts', '.tsx', '.js'],
      alias: {
        'react-native': 'react-native-web',
      },
      fallback: {
        path: require.resolve('path-browserify'),
        fs: false,
        crypto: false,
      },
    },
    module: {
      rules: [
        {
          test: /\.[jt]sx?$/,
          include: [
            path.resolve(__dirname, 'src'),
            path.resolve(__dirname, 'node_modules/expo'),
            path.resolve(__dirname, 'node_modules/expo-sqlite'),
          ],
          use: {
            loader: 'babel-loader',
          },
        },
        {
          test: /sql-wasm\.wasm$/,
          type: 'asset/resource',
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'index.html'),
      }),
    ],
    devServer: {
      static: {
        directory: path.resolve(__dirname, 'dist'),
      },
      port: 4173,
      hot: true,
    },
  };
};
