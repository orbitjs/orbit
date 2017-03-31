"use strict";

const build = require('@glimmer/build');
const packageDist = require('@glimmer/build/lib/package-dist');
const funnel = require('broccoli-funnel');
const path = require('path');

let buildOptions = {
  external: [
    '@orbit/utils',
    '@orbit/core',
    '@orbit/data'
  ]
};

if (process.env.BROCCOLI_ENV === 'tests') {
  buildOptions.vendorTrees = [
    packageDist('@orbit/utils'),
    packageDist('@orbit/core'),
    packageDist('@orbit/data'),
    funnel(path.join(require.resolve('rsvp'), '..'), { include: ['rsvp.js'] }),
    funnel(path.join(require.resolve('sinon'), '../../pkg'), { include: ['sinon.js'] }),
    funnel(path.join(require.resolve('whatwg-fetch'), '../'), { include: ['fetch.js'] })
  ];
}

module.exports = build(buildOptions);
