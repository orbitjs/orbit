import Orbit from 'orbit/main';
import { assert } from 'orbit/lib/assert';
import Source from './source';
import Cache from './cache';

/**
 Source for storing in-memory data

 @class MemorySource
 @namespace OC
 @extends OC.Source
 @param {Object}    [options]
 @param {OC.Schema} [options.schema] Schema for source (required)
 @param {Object}    [options.cacheOptions] Options for internal cache.
 @constructor
 */
export default class MemorySource extends Source {
  constructor(options) {
    assert('MemorySource constructor requires `options`', options);
    assert('MemorySource\'s `schema` must be specified in `options.schema` constructor argument', options.schema);

    super(options);

    this.cache = new Cache(options.schema, options.cacheOptions);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _transform(transform) {
    this.cache.transform(transform);
    return this.transformed(transform);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Queryable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _query(query) {
    return this.cache.query(query);
  }
}
