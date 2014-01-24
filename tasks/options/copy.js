module.exports = {
  // These copy tasks happen before transpile or hinting. They
  // prepare the build pipeline by moving JavaScript files to
  // tmp/javascript.
  //
  "prepare": {
    files: [{
      expand: true,
      cwd: 'lib/',
      src: '**/*.js',
      dest: 'tmp/javascript/lib'
    },
    {
      expand: true,
      cwd: 'test/tests/',
      src: ['**/*.js', '!test_helper.js', '!test_loader.js'],
      dest: 'tmp/javascript/tests/'
    }]
  },
  // Stage moves files to their final destinations after the rest
  // of the build cycle has run.
  "stage": {
    files: [{
      expand: true,
      cwd: 'test/',
      src: ['index.html', 'tests/test_helper.js', 'tests/test_loader.js', 'vendor/**/*'],
      dest: 'tmp/public/test/'
    }]
  },
  "vendor": {
    src: ['vendor/**/*.js', 'vendor/**/*.css'],
    dest: 'tmp/public/test/'
  },
  "dist": {
    files: [{
      expand: true,
      cwd: 'tmp/public/test/lib',
      src: ['**/*.js'],
      dest: 'dist/'
    }]
  },
};
