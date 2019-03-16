"use strict";

const build = require('@glimmer/build');
const packageDist = require('@glimmer/build/lib/package-dist');
const funnel = require('broccoli-funnel');
const path = require('path');

let buildOptions = {
  external: [
    '@orbit/core',
    '@orbit/coordinator',
    '@orbit/data',
    '@orbit/immutable',
    '@orbit/indexeddb',
    '@orbit/indexeddb-bucket',
    '@orbit/jsonapi',
    '@orbit/local-storage',
    '@orbit/local-storage-bucket',
    '@orbit/record-cache',
    '@orbit/serializers',
    '@orbit/store',
    '@orbit/utils',
    'sinon'
  ]
};

if (process.env.BROCCOLI_ENV === 'tests') {
  buildOptions.vendorTrees = [
    packageDist('@orbit/core'),
    packageDist('@orbit/coordinator'),
    packageDist('@orbit/data'),
    packageDist('@orbit/record-cache'),
    packageDist('@orbit/immutable'),
    packageDist('@orbit/indexeddb'),
    packageDist('@orbit/indexeddb-bucket'),
    packageDist('@orbit/jsonapi'),
    packageDist('@orbit/local-storage'),
    packageDist('@orbit/local-storage-bucket'),
    packageDist('@orbit/serializers'),
    packageDist('@orbit/store'),
    packageDist('@orbit/utils'),
    funnel(path.join(require.resolve('rsvp'), '..'), { include: ['rsvp.js'] }),
    funnel(path.join(require.resolve('sinon'), '../../pkg'), { include: ['sinon.js'] }),
    funnel(path.join(require.resolve('whatwg-fetch'), '../'), { include: ['fetch.js'] })
  ];
}

module.exports = build(buildOptions);
