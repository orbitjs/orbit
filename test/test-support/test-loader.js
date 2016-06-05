/* globals requirejs, require */

QUnit.config.autostart = false;
QUnit.config.urlConfig.push({ id: 'nolint', label: 'Disable Linting' });

// TODO: load based on params
setTimeout(function() {
  for (var moduleName in requirejs.entries) {
    var isTest = moduleName.match(/[-_]test$/);
    var isSkippedLintTest = QUnit.urlParams.nolint && moduleName.match(/\.lint-test$/);

    if (isTest && !isSkippedLintTest) {
      require(moduleName);
    }
  }
  QUnit.start();
}, 250);

