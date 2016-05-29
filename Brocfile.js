var concat     = require('broccoli-sourcemap-concat');
var Funnel     = require('broccoli-funnel');
var mergeTrees = require('broccoli-merge-trees');
var compileES6Modules = require('broccoli-es6modules');
var transpileES6 = require('broccoli-babel-transpiler');
var jshintTree = require('broccoli-jshint');
var replace = require('broccoli-replace');
var gitVersion = require('git-repo-version');
var jscs = require('broccoli-jscs');

// extract version from git
// note: remove leading `v` (since by default our tags use a `v` prefix)
var version = gitVersion().replace(/^v/, '');

var packages = [
  {
    name: 'orbit',
    include: [/orbit.js/,
              /(orbit\/.+.js)/]
  },
  {
    name: 'orbit-common',
    include: [/orbit-common.js/,
              /(orbit\-common\/.+.js)/],
    exclude: [/orbit-common\/local-storage-source.js/,
              /orbit-common\/jsonapi\/serializer.js/,
              /orbit-common\/jsonapi-source.js/]
  },
  {
    name: 'orbit-common-local-storage',
    include: [/orbit-common\/local-storage-source.js/]
  },
  {
    name: 'orbit-common-jsonapi',
    include: [/orbit-common\/jsonapi\/serializer.js/,
              /orbit-common\/jsonapi-source.js/]
  }
];

var loader = new Funnel('bower_components', {
  srcDir: 'loader',
  files: ['loader.js'],
  destDir: '/assets/'
});

var globalizedLoader = new Funnel('build-support', {
  srcDir: '/',
  files: ['globalized-loader.js'],
  destDir: '/assets/'
});

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
var globalized = {};

packages.forEach(function(package) {
  src[package.name] = new Funnel('src', {
    srcDir: '/',
    include: package.include,
    exclude: package.exclude || [],
    destDir: '/'
  });

  main[package.name] = mergeTrees([ src[package.name] ]);
  main[package.name] = new compileES6Modules(main[package.name]);
  main[package.name] = new transpileES6(main[package.name]);
  main[package.name] = concat(main[package.name], {
    inputFiles: ['**/*.js'],
    outputFile: '/' + package.name + '.amd.js'
  });

  var support = new Funnel('build-support', {
    srcDir: '/',
    files: ['iife-start.js', 'globalize-' + package.name + '.js', 'iife-stop.js'],
    destDir: '/'
  });

  var loaderTree = (package.name === 'orbit' ? loader : globalizedLoader);
  var loaderFile = (package.name === 'orbit' ? 'loader.js' : 'globalized-loader.js');

  globalized[package.name] = concat(mergeTrees([loaderTree, main[package.name], support]), {
    inputFiles: ['iife-start.js', 'assets/' + loaderFile, package.name + '.amd.js', 'globalize-' + package.name + '.js', 'iife-stop.js'],
    outputFile: '/' + package.name + '.js'
  });
});

var rxjs = (function() {
  var original = new Funnel('node_modules', {
    srcDir: 'rxjs-es',
    include: ['**/*.js'],
    destDir: 'rxjs'
  });

  var withAsyncFix = replace(original, {
    files: [
      'rxjs/Rx.DOM.js',
      'rxjs/Rx.js'
    ],
    patterns: [
      { match: /async,/, replace: 'async: async,' }
    ]
  });

  return withAsyncFix;
})();

var symbolObservable = new Funnel('node_modules', {
  srcDir: 'symbol-observable',
  include: ['ponyfill.js'],
  destDir: '.',
  getDestinationPath: function() {
    return 'symbol-observable.js';
  }
});

var allSrc = mergeTrees(Object.keys(src).map(function(package) {
  return src[package];
}));
var jshintSrc = jshintTree(allSrc);
var jscsSrc = jscs(allSrc, {esnext: true, enabled: true});
allSrc = mergeTrees([allSrc, rxjs, symbolObservable]);

var allMain = mergeTrees(Object.keys(main).map(function(package) {
  return main[package];
}));
var allGlobalized = mergeTrees(Object.keys(globalized).map(function(package) {
  return globalized[package];
}));

var jshintTest = jshintTree(tests);
var jscsTest = jscs(tests, {esnext: true, enabled: true});

var mainWithTests = mergeTrees([allSrc, tests, jshintSrc, jshintTest, jscsSrc, jscsTest], { overwrite: true });

mainWithTests = new compileES6Modules(mainWithTests);
mainWithTests = new transpileES6(mainWithTests);


mainWithTests = concat(mainWithTests, {
  inputFiles: ['**/*.js'],
  outputFile: '/assets/tests.amd.js'
});

var vendor = concat('', {
  inputFiles: [
    'node_modules/immutable/dist/immutable.js',
    'bower_components/jquery/dist/jquery.js',
    'bower_components/rsvp/rsvp.js'],
  outputFile: '/assets/vendor.js'
});

var qunit = new Funnel('bower_components', {
  srcDir: '/qunit/qunit',
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

module.exports = mergeTrees([loader, globalizedLoader, allMain,
  allGlobalized, mainWithTests, vendor, qunit, testSupport, testIndex,
  generatedPackageConfig, buildExtras]);
