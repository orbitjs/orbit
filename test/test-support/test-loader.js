/* globals requirejs, require */

var moduleName, shouldLoad;

QUnit.config.autostart = false;
QUnit.config.urlConfig.push({ id: 'nojshint', label: 'Disable JSHint'});

// TODO: load based on params
setTimeout(function() {
  for (moduleName in requirejs.entries) {
    shouldLoad = false;

    if (moduleName.match(/[-_]test$/)) { shouldLoad = true; }
    if (!QUnit.urlParams.nojshint && moduleName.match(/\.jshint$/)) { shouldLoad = true; }

    if (shouldLoad) { require(moduleName); }
  }
  QUnit.start();
}, 250);
