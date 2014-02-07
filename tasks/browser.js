module.exports = function(grunt) {
  'use strict';

  grunt.registerMultiTask('browser', 'Export objects to their appropriate namespaces on `window`', function() {
    var options = this.options({
      name: function(file) {
        return file;
      },
      namespace: function(name) {
        return "<%= pkg.namespace %>";
      },
      module: function(name) {
        return "<%= pkg.name %>";
      }
    });

    this.files.forEach(function(f) {
      var output = ['(function(global) {'];

      output.push.apply(output, f.src.map(grunt.file.read));

      f.src.forEach(function(file) {
        var name = options.name(file);
        output.push("global." + options.namespace(name) + " = require('" + options.module(name) + "');");
        output.push('}(window));');
      });

      grunt.file.write(f.dest, grunt.template.process(output.join('\n')));
    });
  });
};
