module.exports = {
  lib: {
    src: [
      'src/**/*.js',
      '!src/orbit/lib/eq.js',
    ],
    options: { jshintrc: '.jshintrc' }
  },
  tooling: {
    src: [
      'Gruntfile.js',
      'tasks/**/*.js'
    ],
    options: { jshintrc: 'tasks/.jshintrc' }
  },
  tests: {
    src: [
      'tests/**/*.js',
      '!tests/unit/lib/eq_test.js'
    ],
    options: { jshintrc: 'tests/.jshintrc' }
  },
  options: {
    jshintrc: '.jshintrc',
    force: true
  }
};
