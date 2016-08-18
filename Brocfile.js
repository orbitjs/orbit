/* eslint-env node */
var concat     = require('broccoli-sourcemap-concat');
var Funnel     = require('broccoli-funnel');
var mergeTrees = require('broccoli-merge-trees');
var CompileES6Modules = require('broccoli-es6modules');
var TranspileES6 = require('broccoli-babel-transpiler');
var replace = require('broccoli-replace');
var gitVersion = require('git-repo-version');
var eslint = require('broccoli-lint-eslint');
var testGenerator = require('./build-support/test-generator');

// extract version from git
// note: remove leading `v` (since by default our tags use a `v` prefix)
var version = gitVersion().replace(/^v/, '');

var packages = [
  {
    name: 'orbit',
    include: ['orbit.js',
              'orbit/**/*.js']
  },
  {
    name: 'orbit-common',
    include: ['orbit-common.js',
              'orbit-common/**/*.js']
  },
  {
    name: 'orbit-store',
    include: ['orbit-store.js',
              'orbit-store/**/*.js']
  },
  {
    name: 'orbit-local-storage',
    include: ['orbit-local-storage.js',
              'orbit-local-storage/**/*.js']
  },
  {
    name: 'orbit-jsonapi',
    include: ['orbit-jsonapi.js',
              'orbit-jsonapi/**/*.js']
  }
];

var loader = new Funnel('node_modules', {
  srcDir: 'loader.js/lib/loader/',
  files: ['loader.js'],
  destDir: '/assets/'
});

// var globalizedLoader = new Funnel('build-support', {
//   srcDir: '/',
//   files: ['globalized-loader.js'],
//   destDir: '/assets/'
// });

var generatedPackageConfig = new Funnel('build-support', {
  srcDir: '/',
  destDir: '/',
  files: ['bower.json', 'package.json']
});

generatedPackageConfig = replace(generatedPackageConfig, {
  files: ['bower.json', 'package.json'],
  pattern: {
    match: /VERSION_PLACEHOLDER/,
    replacement: function() {
      return version;
    }
  }
});

var tests = new Funnel('test', {
  srcDir: '/tests',
  include: [/.js$/],
  destDir: '/tests'
});

var buildExtras = new Funnel('build-support', {
  srcDir: '/',
  destDir: '/',
  files: ['README.md', 'LICENSE']
});

var src = {};
var main = {};
// var globalized = {};

packages.forEach(function(pkg) {
  src[pkg.name] = new Funnel('src', {
    srcDir: '/',
    include: pkg.include,
    exclude: pkg.exclude || [],
    destDir: '/'
  });

  main[pkg.name] = mergeTrees([src[pkg.name]]);
  main[pkg.name] = new CompileES6Modules(main[pkg.name]);
  main[pkg.name] = new TranspileES6(main[pkg.name]);
  main[pkg.name] = concat(main[pkg.name], {
    inputFiles: ['**/*.js'],
    outputFile: '/' + pkg.name + '.amd.js'
  });

  // var support = new Funnel('build-support', {
  //   srcDir: '/',
  //   files: ['iife-start.js', 'globalize-' + pkg.name + '.js', 'iife-stop.js'],
  //   destDir: '/'
  // });
  //
  // var loaderTree = (pkg.name === 'orbit' ? loader : globalizedLoader);
  // var loaderFile = (pkg.name === 'orbit' ? 'loader.js' : 'globalized-loader.js');
  //
  // globalized[pkg.name] = concat(mergeTrees([loaderTree, main[pkg.name], support]), {
  //   inputFiles: ['iife-start.js', 'assets/' + loaderFile, pkg.name + '.amd.js', 'globalize-' + pkg.name + '.js', 'iife-stop.js'],
  //   outputFile: '/' + pkg.name + '.js'
  // });
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

// var allGlobalized = mergeTrees(Object.keys(globalized).map(function(pkg) {
//   return globalized[pkg];
// }));

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
  // globalizedLoader,
  allMain,
  // allGlobalized,
  mainWithTests,
  vendor,
  qunit,
  testSupport,
  testIndex,
  generatedPackageConfig,
  buildExtras]);
