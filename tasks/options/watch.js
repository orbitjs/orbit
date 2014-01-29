module.exports = {
  main: {
    files: ['lib/**/*', 'public/**/*', 'vendor/**/*', 'test/**/*'],
    tasks: ['build:debug']
  },
  test: {
    files: ['lib/**/*', 'public/**/*', 'vendor/**/*', 'test/**/*'],
    tasks: ['build:debug', 'karma:server:run']
  }
};
