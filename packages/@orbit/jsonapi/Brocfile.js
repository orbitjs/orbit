'use strict';

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
    'sinon'
  ]
};

if (process.env.BROCCOLI_ENV === 'tests') {
  buildOptions.vendorTrees = [
    packageDist('@orbit/utils', { lang: 'es2017' }),
    packageDist('@orbit/core', { lang: 'es2017' }),
    packageDist('@orbit/data', { lang: 'es2017' }),
    packageDist('@orbit/serializers', { lang: 'es2017' }),
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
