import Orbit from 'orbit/main';
import { assert } from 'orbit/lib/assert';
import Source from './source';
import Cache from './cache';
import Queryable from 'orbit/queryable';
import Updatable from 'orbit/updatable';
import TransformBuilder from './transform/builder';

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

    Queryable.extend(this);
    Updatable.extend(this);
    this.transformBuilder = new TransformBuilder();

    this.cache = new Cache(options.schema, options.cacheOptions);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Updatable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _update(transform) {
    this.cache.transform(transform);
    return Orbit.Promise.resolve([transform]);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Queryable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _query(query) {
    return Orbit.Promise.resolve(this.cache.query(query));
  }
}
