import { assert } from 'orbit/lib/assert';

/**
 Base class for sources.

 @class Source
 @namespace OC
 @param {Object}    [options] Options for source
 @param {OC.Schema} [options.schema] Schema for source (required)
 @constructor
 */
export default class Source {
  constructor(options = {}) {
    assert('Source\'s `schema` must be specified in `options.schema` constructor argument', options.schema);

    this.schema = options.schema;
    this.name   = options.name;
  }
}
