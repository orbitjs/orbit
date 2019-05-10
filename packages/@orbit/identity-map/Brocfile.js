"use strict";

const build = require('@glimmer/build');
const packageDist = require('@glimmer/build/lib/package-dist');

let buildOptions = {};

if (process.env.BROCCOLI_ENV === 'tests') {
  buildOptions.vendorTrees = [
    packageDist('@orbit/core'),
    packageDist('@orbit/data'),
    packageDist('@orbit/utils')
  ];
}

module.exports = build(buildOptions);
