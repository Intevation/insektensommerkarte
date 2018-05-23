var path = require('path');
var CompressionPlugin = require('compression-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
// https://github.com/webpack-contrib/mini-css-extract-plugin
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = function(env, argv) {
  console.log(argv);
  return {
    entry: './app/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      publicPath: 'dist/',
      filename: '[name].js'
    },
    // https://webpack.js.org/configuration/devtool/
    // for production
    // devtool: 'nosources-source-map',
    // for development
    // devtool: 'eval-source-map',
    devtool: 'none',
    performance: {
      hints: 'warning'
    },
    module: {
      // https://github.com/mapbox/mapbox-gl-js/issues/4359#issuecomment-288001933
      noParse: /(mapbox-gl)\.js$/,
      rules: [
        {
          enforce: 'pre',
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'eslint-loader'
        },
        {
          test: /\.json$/,
          loader: 'json-loader'
        },
        {
          test: /\.js$/,
          exclude: /(node_modules|bower_components)/,
          loader: 'babel-loader',
          query: {
            presets: [
              ['env', {
                'targets': {
                  // https://github.com/browserslist/browserslist
                  // http://browserl.ist/?q=last+1+years
                  'browsers': ['last 1 years']
                }
              }
              ]
            ]
          }
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader'
          ]
        },
        {
          test: /\.png|csv$/,
          use: {
            loader: 'url-loader',
            options: {
              limit: 100000
            }
          }
        },
        {
          test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
          use: {
            loader: 'url-loader',
            options: {
              limit: 100000
            }
          }
        }, {
          test: /\.html$/,
          use: {
            loader: 'mustache-loader'
            // loader: 'mustache?minify'
            // loader: 'mustache?{ minify: { removeComments: false } }'
            // loader: 'mustache?noShortcut'
          }
        }
      ]
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          vendor: {
            name: 'vendor',
            test: /jquery|mapbox-gl|uikit|csv2geojson/, // you may add "vendor.js" here if you want to
            chunks: 'all',
            enforce: true
          },
          styles: {
            name: 'main',
            test: /\.css$/,
            chunks: 'all',
            enforce: true
          }
        }
      },
      minimizer: [
        new UglifyJsPlugin({
          cache: true,
          parallel: true,
          sourceMap: false // set to true if you want JS source maps
        }),
        new OptimizeCSSAssetsPlugin({})
      ]
    },
    plugins: [
      new CleanWebpackPlugin(['dist']),
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // both options are optional
        filename: '[name].css'
      }),
      new CompressionPlugin({
        asset: '[path].gz[query]',
        algorithm: 'gzip',
        test: /\.js$|\.html$/,
        threshold: 10240,
        minRatio: 0.8
      })
    ]
  };
}
