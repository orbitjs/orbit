module.exports = {
  main: {
    files: ['lib/**/*', 'public/**/*', 'vendor/**/*', 'test/**/*'],
    tasks: ['build:tests']
  },
  test: {
    files: ['lib/**/*', 'public/**/*', 'vendor/**/*', 'test/**/*'],
    tasks: ['build:tests', 'qunit:local']
  }
};
