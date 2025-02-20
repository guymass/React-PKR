const path = require('path');

module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          "fs": false,
          "path": require.resolve("path-browserify"),
          "crypto": require.resolve("crypto-browserify"),
          "events": require.resolve("events/"),
          "stream": require.resolve("stream-browserify"),
          "util": require.resolve("util/"),
          "dns": false,
          "net": false,
          "tls": false,
        }
      }
    }
  }
};