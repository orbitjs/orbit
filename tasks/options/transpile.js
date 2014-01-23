var grunt = require('grunt');

module.exports = {
  "tests": {
    type: 'amd',
    moduleName: function(path) {
      return grunt.config.process('tests/') + path;
    },
    files: [{
      expand: true,
      cwd: 'tmp/javascript/tests/',
      src: '**/*.js',
      dest: 'tmp/transpiled/tests/'
    }]
  },
  "src": {
    type: 'amd',
    moduleName: function(path) {
      return path;
    },
    files: [{
      expand: true,
      cwd: 'tmp/javascript/lib/',
      src: '**/*.js',
      dest: 'tmp/transpiled/lib/'
    }]
  }
};
