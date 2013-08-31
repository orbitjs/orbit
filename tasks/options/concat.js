module.exports = {
  orbit: {
    src: ['tmp/transpiled/src/**/*.js'],
    dest: 'tmp/public/assets/orbit.js'
  },

  vendor: {
    src: ['tmp/javascript/src/vendor/**/*.js'],
    dest: 'tmp/public/assets/vendor.js'
  },

  test: {
    src: 'tmp/transpiled/tests/**/*.js',
    dest: 'tmp/public/tests/tests.js'
  }
};
