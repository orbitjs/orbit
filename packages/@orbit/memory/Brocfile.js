'use strict';

const build = require('@glimmer/build');
const packageDist = require('@glimmer/build/lib/package-dist');

let buildOptions = {
  external: [
    '@orbit/utils',
    '@orbit/core',
    '@orbit/data',
    '@orbit/immutable',
    '@orbit/record-cache'
  ]
};

if (process.env.BROCCOLI_ENV === 'tests') {
  buildOptions.vendorTrees = [
    packageDist('@orbit/utils', { lang: 'es2017' }),
    packageDist('@orbit/core', { lang: 'es2017' }),
    packageDist('@orbit/data', { lang: 'es2017' }),
    packageDist('@orbit/immutable', { lang: 'es2017' }),
    packageDist('@orbit/record-cache', { lang: 'es2017' })
  ];
  buildOptions.test = { es5: false };
}

module.exports = build(buildOptions);
