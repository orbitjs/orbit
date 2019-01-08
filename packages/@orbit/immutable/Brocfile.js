"use strict";

const build = require('@glimmer/build');
// const packageDist = require('@glimmer/build/lib/package-dist');
// const funnel = require('broccoli-funnel');
// const path = require('path');

let buildOptions = {
  external: [
  ]
};

if (process.env.BROCCOLI_ENV === 'tests') {
  buildOptions.vendorTrees = [
  ];
}

module.exports = build(buildOptions);
