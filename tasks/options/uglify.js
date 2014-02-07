module.exports = {
  amd: {
    options: {
      mangle: true
    },
    files: [{
      expand: true,
      cwd: 'dist',
      src: ['*.amd.js'],
      dest: 'dist/',
      ext: '.amd.min.js'
    }]
  },
  browser: {
    options: {
      mangle: true
    },
    files: [{
      expand: true,
      cwd: 'dist',
      src: ['*.js'],
      dest: 'dist/',
      ext: '.min.js'
    }]
  }
};
