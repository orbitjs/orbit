'use strict';

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
    '@orbit/memory',
    '@orbit/utils',
    'sinon'
  ]
};

if (process.env.BROCCOLI_ENV === 'tests') {
  buildOptions.vendorTrees = [
    packageDist('@orbit/core', { lang: 'es2017' }),
    packageDist('@orbit/coordinator', { lang: 'es2017' }),
    packageDist('@orbit/data', { lang: 'es2017' }),
    packageDist('@orbit/record-cache', { lang: 'es2017' }),
    packageDist('@orbit/immutable', { lang: 'es2017' }),
    packageDist('@orbit/indexeddb', { lang: 'es2017' }),
    packageDist('@orbit/indexeddb-bucket', { lang: 'es2017' }),
    packageDist('@orbit/jsonapi', { lang: 'es2017' }),
    packageDist('@orbit/local-storage', { lang: 'es2017' }),
    packageDist('@orbit/local-storage-bucket', { lang: 'es2017' }),
    packageDist('@orbit/serializers', { lang: 'es2017' }),
    packageDist('@orbit/memory', { lang: 'es2017' }),
    packageDist('@orbit/utils', { lang: 'es2017' }),
    funnel(path.join(require.resolve('sinon'), '../../pkg'), {
      include: ['sinon.js']
    }),
    funnel(path.join(require.resolve('whatwg-fetch'), '../'), {
      include: ['fetch.js']
    })
  ];
  buildOptions.test = { es5: false };
}

module.exports = build(buildOptions);
