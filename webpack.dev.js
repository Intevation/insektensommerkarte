var path = require('path');
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
    devtool: 'eval-source-map',
    devServer: {
      compress: true,
      port: 9000,
      host: '0.0.0.0',
      clientLogLevel: 'error'
    },
    performance: {
      hints: 'warning'
    },
    module: {
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
            'style-loader',
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
    plugins: [
      new CleanWebpackPlugin(['dist'])
    ]
  };
}
