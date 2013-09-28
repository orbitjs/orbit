module.exports = {
  all: {
    src: [
      'Gruntfile.js',
      'src/orbit/**/*.js',
      'tests/**/*.js',
      '!src/orbit/lib/eq.js',
      '!tests/unit/lib/eq_test.js'
    ]
  },
  options: {
    jshintrc: '.jshintrc',
    force: true
  }
};
