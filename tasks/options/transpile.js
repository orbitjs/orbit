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
      //return path;
      return grunt.config.process('<%= pkg.namespace %>/') + path;
    },
    files: [{
      expand: true,
      cwd: 'tmp/javascript/src/orbit/',
      src: '**/*.js',
      dest: 'tmp/transpiled/src/orbit/'
    }]
  }
};
