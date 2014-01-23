module.exports = {
  main: {
    files: ['lib/**/*', 'public/**/*', 'vendor/**/*', 'tests/**/*'],
    tasks: ['build:debug']
  },
  test: {
    files: ['lib/**/*', 'public/**/*', 'vendor/**/*', 'tests/**/*'],
    tasks: ['build:debug', 'karma:server:run']
  }
};
