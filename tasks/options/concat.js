module.exports = {
  orbit: {
    src: ['tmp/transpiled/lib/**/*.js'],
    dest: 'tmp/public/assets/orbit.js'
  },

  test: {
    src: 'tmp/transpiled/tests/**/*.js',
    dest: 'tmp/public/tests/tests.js'
  }
};
