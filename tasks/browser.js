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
      },
      preDefine: function(name) {
        return null;
      },
      postRequire: function(name) {
        return null;
      }
    });

    this.files.forEach(function(f) {
      var output = ['(function(global) {'];

      f.src.forEach(function(file) {
        var name = options.name(file);

        var preDefine = options.preDefine(name);
        if (preDefine) output.push.apply(output, preDefine);

        output.push(grunt.file.read(file));

        options.modules(name).forEach(function(module) {
          output.push("global." + module.namespace + " = requireModule('" + module.name + "');");
        });

        var postRequire = options.postRequire(name);
        if (postRequire) output.push.apply(output, postRequire);

        output.push('}(window));');
      });

      grunt.file.write(f.dest, grunt.template.process(output.join('\n')));
    });
  });
};
