module.exports = {
  tests: {
    files: [{
      expand: true,
      cwd: 'vendor/',
      src: ['**/*.js'],
      dest: 'tmp/public/test/vendor/'
    }, {
      expand: true,
      cwd: 'test/',
      src: ['index.html', 'tests/test_helper.js', 'tests/test_loader.js', 'vendor/**/*'],
      dest: 'tmp/public/test/'
    }, {
      expand: true,
      cwd: 'tmp/built/',
      src: ['*.amd.js'],
      dest: 'tmp/public/test/lib/'
    }]
  },
  dist: {
    files: [{
      expand: true,
      cwd: 'tmp/built/',
      src: ['*.js'],
      dest: 'dist/'
    }]
  },
};
