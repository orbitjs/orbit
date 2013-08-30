module.exports = {
  main: {
    files: ['src/**/*', 'public/**/*', 'vendor/**/*', 'tests/**/*'],
    tasks: ['build:debug']
  },
  test: {
    files: ['src/**/*', 'public/**/*', 'vendor/**/*', 'tests/**/*'],
    tasks: ['build:debug', 'karma:server:run']
  }
};
