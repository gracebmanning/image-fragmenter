module.exports = {
  devServer: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.ignoreWarnings = [
        (warning) => {
          return (
            warning.message.includes('Critical dependency: the request of a dependency is an expression') &&
            warning.module.resource.includes('@ffmpeg/ffmpeg')
          );
        },
        ...(webpackConfig.ignoreWarnings || []),
      ];

      return webpackConfig;
    },
  },
};
