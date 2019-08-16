'use strict';

const build = require('@glimmer/build');

const buildOptions = {
  test: { es5: false }
};

module.exports = build(buildOptions);
