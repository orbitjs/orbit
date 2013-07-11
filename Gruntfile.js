function config(name) {
  return require('./configurations/' + name);
}

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    clean: ["dist"],
    watch: config('watch') ,
    concat: config('concat'),
    browser: config('browser'),
    connect: config('connect'),
    transpile: config('transpile')
  });

  this.registerTask('default', ['build']);

  this.registerTask('build', "Builds a distributable version of the current project", [
                    'clean',
                    'transpile:amd',
                    'concat:library',
                    'concat:browser',
                    'browser:dist',
                    'bytes']);

  this.registerTask('tests', "Builds the test package", [
                    'build',
                    'concat:deps',
                    'transpile:tests']);

  this.registerTask('server', [
                    'build',
                    'tests',
                    'connect',
                    'watch']);

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-es6-module-transpiler');

  grunt.task.loadTasks('tasks');
};