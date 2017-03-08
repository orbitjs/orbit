"use strict";

const build = require('@glimmer/build');
const buildVendorPackage = require('@glimmer/build/lib/build-vendor-package');
const funnel = require('broccoli-funnel');
const path = require('path');

let buildOptions = {};

if (process.env.BROCCOLI_ENV === 'tests') {
  buildOptions.vendorTrees = [
    buildVendorPackage('@orbit/utils', { external: ['babel-helpers'] }),
    buildVendorPackage('@orbit/core', { external: ['babel-helpers', '@orbit/utils'] }),
    funnel(path.join(require.resolve('babel-polyfill'), '../../dist'), {
      include: ['polyfill.js'] }),
    funnel(path.join(require.resolve('rsvp'), '..'), {
      include: ['rsvp.js'] })
  ];
}

module.exports = build(buildOptions);
