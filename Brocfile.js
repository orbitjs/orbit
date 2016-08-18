/* eslint-env node */
var concat     = require('broccoli-sourcemap-concat');
var Funnel     = require('broccoli-funnel');
var mergeTrees = require('broccoli-merge-trees');
var replace    = require('broccoli-string-replace');
var CompileES6Modules = require('broccoli-es6modules');
var TranspileES6 = require('broccoli-babel-transpiler');
var eslint = require('broccoli-lint-eslint');
var testGenerator = require('./build-support/test-generator');

var packages = [
  'orbit',
  'orbit-common',
  'orbit-store',
  'orbit-local-storage',
  'orbit-jsonapi'
];

var loader = new Funnel('node_modules', {
  srcDir: 'loader.js/lib/loader/',
  files: ['loader.js'],
  destDir: '/assets/'
});

var tests = new Funnel('test', {
  srcDir: '/tests',
  include: [/.js$/],
  destDir: '/tests'
});

var src = {};
var main = {};

packages.forEach(function(pkg) {
  src[pkg] = new Funnel('src', {
    srcDir: '/',
    include: [pkg + '.js', pkg + '/**/*.js'],
    exclude: [],
    destDir: '/'
  });

  main[pkg] = mergeTrees([src[pkg]]);

  // generate CJS
  var cjs = new CompileES6Modules(main[pkg], {
    format: 'cjs'
  });
  cjs = new TranspileES6(cjs);
  cjs = replace(cjs, {
    files: ['**/*.js'],
    pattern: {
      match: /require\('orbit/g,
      replacement: function() {
        return "require('orbit.js/orbit";
      }
    }
  });
  cjs = new Funnel(cjs, {
    srcDir: '/',
    destDir: 'cjs'
  });

  // generate AMD
  main[pkg] = new CompileES6Modules(main[pkg], {
    format: 'umd'
  });
  main[pkg] = new TranspileES6(main[pkg]);
  main[pkg] = concat(main[pkg], {
    inputFiles: ['**/*.js'],
    outputFile: '/amd/' + pkg + '.js'
  });

  main[pkg] = mergeTrees([main[pkg], cjs]);
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

var allSrc = mergeTrees(Object.keys(src).map(function(pkg) {
  return src[pkg];
}));

var eslintSrc = mergeTrees(Object.keys(src).map(function(pkg) {
  return eslint(src[pkg], { testGenerator: testGenerator });
}));

allSrc = mergeTrees([allSrc, rxjs, symbolObservable]);

var allMain = mergeTrees(Object.keys(main).map(function(pkg) {
  return main[pkg];
}));

var eslintTests = eslint(tests, { testGenerator: testGenerator });

var mainWithTests = mergeTrees([allSrc, tests, eslintSrc, eslintTests], { overwrite: true });

mainWithTests = new CompileES6Modules(mainWithTests);
mainWithTests = new TranspileES6(mainWithTests);

mainWithTests = concat(mainWithTests, {
  inputFiles: ['**/*.js'],
  outputFile: '/assets/tests.amd.js'
});

var vendor = concat('', {
  inputFiles: [
    'node_modules/immutable/dist/immutable.js',
    'node_modules/whatwg-fetch/fetch.js',
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

module.exports = mergeTrees([
  loader,
  allMain,
  mainWithTests,
  vendor,
  qunit,
  testSupport,
  testIndex
]);
