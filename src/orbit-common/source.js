import { assert } from 'orbit/lib/assert';
import OrbitSource from 'orbit/source';

/**
 Base class for sources.

 @class Source
 @namespace OC
 @param {Object}    options - Options for source
 @param {OC.Schema} options.schema - Schema for source
 @param {String}    options.name - Name for source
 @constructor
 */
export default class Source extends OrbitSource {
  constructor(options = {}) {
    assert('Source\'s `schema` must be specified in `options.schema` constructor argument', options.schema);

    super(...arguments);

    this.schema = options.schema;
  }
}
