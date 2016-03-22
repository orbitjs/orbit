import Orbit from 'orbit/main';
import { assert } from 'orbit/lib/assert';

/**
 `Source` is an abstract base class to be extended by other sources.

 @class Source
 @namespace OC
 @param {Object}    [options]
 @param {OC.Schema} [options.schema] Schema for source (required)
 @constructor
*/
export default class Source {
  constructor(options = {}) {
    assert('Source\'s `schema` must be specified in `options.schema` constructor argument', options.schema);

    this.schema = options.schema;
  }
}
