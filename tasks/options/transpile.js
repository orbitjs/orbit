function nameFor(path) {
  var result,  match;
  if (match = path.match(/^(?:lib|test|test\/tests)\/(.*?)(?:\.js)?$/)) {
    result = match[1];
  } else {
    result = path;
  }

  return path;
}

module.exports = {
  amd: {
    moduleName: nameFor,
    type: 'amd',
    files: [{
      expand: true,
      cwd: 'lib/',
      src: ['**/*.js'],
      dest: 'tmp/transpiled/lib/',
      ext: '.amd.js'
    }]
  },

  tests: {
    moduleName: nameFor,
    type: 'amd',
    files: [{
      expand: true,
      cwd: 'test/tests/',
      src: '**/*.js',
      dest: 'tmp/transpiled/tests/',
      ext: '.amd.js'
    }]
  }
};
