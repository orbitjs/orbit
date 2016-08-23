/* eslint-env node */
var concat     = require('broccoli-sourcemap-concat');
var Funnel     = require('broccoli-funnel');
var mergeTrees = require('broccoli-merge-trees');
var replace    = require('broccoli-string-replace');
var CompileES6Modules = require('broccoli-es6modules');
var TranspileES6 = require('broccoli-babel-transpiler');
var eslint = require('broccoli-lint-eslint');
var testGenerator = require('./test-generator');

module.exports = function build(pkg, namespace) {
  namespace = namespace || pkg;

  // Generate CJS ////////////////////////////////////////////////////////////////

  var cjsSrc = new Funnel('src', {
    srcDir: '/',
    include: ['**/*.js'],
    exclude: [],
    destDir: '/'
  });
  var cjs = new CompileES6Modules(cjsSrc, { format: 'cjs' });
  cjs = new TranspileES6(cjs);
  var cjsDist = new Funnel(cjs, {
    srcDir: '/',
    destDir: 'cjs'
  });

  // Generate AMD ////////////////////////////////////////////////////////////////

  var amdSrc = new Funnel('src', {
    srcDir: '/',
    include: ['**/*.js'],
    exclude: [],
    destDir: namespace
  });
  var amd = new CompileES6Modules(amdSrc);
  amd = new TranspileES6(amd);
  // Convert module named `namespace/index` into simply `namespace`.
  amd = replace(amd, {
    files: [namespace + '/index.js'],
    pattern: {
      match:  "define('" + namespace + "/index'",
      replacement: "define('" + namespace + "'"
    }
  });
  var amdDist = concat(amd, {
    inputFiles: ['**/*.js'],
    outputFile: '/amd/' + pkg + '.js'
  });

  // Generate Dependencies and Tests /////////////////////////////////////////////

  var loader = new Funnel('node_modules', {
    srcDir: 'loader.js/lib/loader/',
    files: ['loader.js'],
    destDir: '/assets/'
  });

  var testSrc = new Funnel('test', {
    srcDir: '/tests',
    include: [/.js$/],
    destDir: '/tests'
  });

  var rxjs = new Funnel('node_modules', {
    srcDir: 'rxjs-es',
    include: ['**/*.js'],
    destDir: 'rxjs'
  });

  var symbolObservable = new Funnel('node_modules', {
    srcDir: 'rxjs-es/node_modules/symbol-observable/es',
    include: ['ponyfill.js'],
    destDir: '.',
    getDestinationPath: function() {
      return 'symbol-observable.js';
    }
  });

  var eslintSrc = eslint(amdSrc, { testGenerator: testGenerator });
  var eslintTests = eslint(testSrc, { testGenerator: testGenerator });
  var depSrc = mergeTrees([rxjs, symbolObservable]);

  var amdSrcWithTests = mergeTrees([amdSrc, depSrc, testSrc, eslintSrc, eslintTests], { overwrite: true });
  amdSrcWithTests = new CompileES6Modules(amdSrcWithTests);
  amdSrcWithTests = new TranspileES6(amdSrcWithTests);
  amdSrcWithTests = concat(amdSrcWithTests, {
    inputFiles: ['**/*.js'],
    outputFile: '/assets/tests.js'
  });

  var vendor = concat('', {
    inputFiles: [
      'node_modules/immutable/dist/immutable.js',
      'node_modules/rsvp/dist/rsvp.js'],
    outputFile: '/assets/vendor.js'
  });

  var qunit = new Funnel('node_modules', {
    srcDir: '/qunitjs/qunit',
    files: ['qunit.js', 'qunit.css'],
    destDir: '/assets'
  });

  var testSupport = concat('test', {
    inputFiles: ['../test/test-support/sinon.js', '../test/test-support/test-shims.js', '../test/test-support/test-loader.js'],
    outputFile: '/assets/test-support.js'
  });

  var testIndex = new Funnel('test', {
    srcDir: '/',
    files: ['index.html'],
    destDir: '/tests'
  });

  return mergeTrees([
    loader,
    amdDist,
    cjsDist,
    amdSrcWithTests,
    vendor,
    qunit,
    testSupport,
    testIndex
  ]);
}
