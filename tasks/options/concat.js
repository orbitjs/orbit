module.exports = {
  orbit: {
    src: ['tmp/transpiled/lib/**/*.js'],
    dest: 'tmp/public/test/lib/orbit.js'
  },

  test: {
    src: 'tmp/transpiled/tests/**/*.js',
    dest: 'tmp/public/test/tests/tests.js'
  }
};
