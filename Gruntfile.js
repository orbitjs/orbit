module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);
  var config = require('load-grunt-config')(grunt, {
    configPath: 'tasks/options',
    init: false
  });

  grunt.loadTasks('tasks');

  grunt.registerTask('default', ['build:dist']);

  grunt.registerTask('build', [
                     'clean:build',
                     'transpile:amd',
                     'concat:amd',
                     'jshint'
                     ]);

  grunt.registerTask('build:tests', [
                     'build',
                     'transpile:tests',
                     'concat:tests',
                     'copy:tests'
                     ]);

  grunt.registerTask('build:dist', "Build a minified & production-ready version of this lib.", [
                     'build',
                     'clean:dist',
                     'concat:browser',
                     'browser:dist',
                     'copy:dist',
                     'uglify'
                     ]);

  grunt.registerTask('test', "Run your apps's tests once. Uses Google Chrome by default. Logs coverage output to tmp/public/coverage.", [
                     'build:tests', 'karma:test']);

  grunt.registerTask('test:ci', "Run your app's tests in PhantomJS. For use in continuous integration (i.e. Travis CI).", [
                     'build:tests', 'karma:ci']);

  grunt.registerTask('test:server', "Start a Karma test server. Automatically reruns your tests when files change and logs the results to the terminal.", [
                     'build:tests', 'karma:server', 'connect', 'watch:test']);

  grunt.registerTask('server', "Run your server in development mode, auto-rebuilding when files change.", [
                     'build:tests', 'connect:server', 'watch:main']);

  grunt.registerTask('docs', [
                     'clean:docs', 'yuidoc']);

  config.env = process.env;
  config.pkg = grunt.file.readJSON('package.json');

  // Load custom tasks from NPM
  grunt.loadNpmTasks('grunt-contrib-yuidoc');

  grunt.initConfig(config);
};
