module.exports = {
  target: 'web',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolveLoader: {
    modules: ['../../node_modules'],
  },
  node: {
    crypto: 'empty',
  },
  resolve: {
    modules: ['./node_modules'],
    extensions: ['.tsx', '.ts', '.js'],
  },
}
