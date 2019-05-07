"use strict";

const build = require('@glimmer/build');
const packageDist = require('@glimmer/build/lib/package-dist');

let buildOptions = {
  external: ['@orbit/utils', '@orbit/core', '@orbit/data']
};

if (process.env.BROCCOLI_ENV === 'tests') {
  buildOptions.vendorTrees = [
    packageDist('@orbit/utils'),
    packageDist('@orbit/core'),
    packageDist('@orbit/data')
  ];
}

module.exports = build(buildOptions);
