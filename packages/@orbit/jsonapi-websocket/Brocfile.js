"use strict";

const build = require('@glimmer/build');
const packageDist = require('@glimmer/build/lib/package-dist');
const funnel = require('broccoli-funnel');
const path = require('path');

let buildOptions = {
  external: [
    '@orbit/utils',
    '@orbit/core',
    '@orbit/data',
    '@orbit/serializers',
    '@orbit/jsonapi',
    'mock-socket'
  ]
};

if (process.env.BROCCOLI_ENV === 'tests') {
  buildOptions.vendorTrees = [
    packageDist('@orbit/utils'),
    packageDist('@orbit/core'),
    packageDist('@orbit/data'),
    packageDist('@orbit/serializers'),
    packageDist('@orbit/jsonapi'),
    funnel(path.join(require.resolve('mock-socket'), '../'), { include: ['mock-socket.js'] })
  ];
}

module.exports = build(buildOptions);
