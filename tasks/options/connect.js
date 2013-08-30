module.exports = {
  server: {
    options: {
      port: process.env.PORT || 8000,
      hostname: '0.0.0.0',
      base: 'tmp/public',
      middleware: middleware
    }
  },
  dist: {
    options: {
      port: process.env.PORT || 8000,
      hostname: '0.0.0.0',
      base: 'dist/',
      middleware: middleware
    }
  }
};

function middleware(connect, options) {
  return [
    connect['static'](options.base),
    connect.directory(options.base)
  ];
}
