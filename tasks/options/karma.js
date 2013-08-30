module.exports = {
  options: {
    configFile: 'karma.conf.js',
    browsers: ['Chrome'],
    reporters: ['coverage', 'dots']
  },
  ci: {
    singleRun: true,
    browsers: ['PhantomJS']
  },
  test: {
    singleRun: true
  },
  server: {
    background: true,
    coverageReporter: {
      type : ['html'],
      dir : 'coverage/'
    }
  },
  browsers: {
    singleRun: true,
    browsers: ['Chrome', 'ChromeCanary', 'Safari', 'Firefox', 'PhantomJS']
  }
};
