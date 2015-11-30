import Orbit from 'orbit/main';
import Queryable from 'orbit/queryable';
import Transformable from 'orbit/transformable';
import { assert } from 'orbit/lib/assert';
import { required } from 'orbit/lib/stubs';
import { Class } from 'orbit/lib/objects';

/**
 `Source` is an abstract base class to be extended by other sources.

 @class Source
 @namespace OC
 @param {Object}    [options]
 @param {OC.Schema} [options.schema] Schema for source (required)
 @constructor
*/
var Source = Class.extend(Queryable, Transformable, {
  init: function(options) {
    this._super();

    assert('Source constructor requires `options`', options);
    assert('Source\'s `schema` must be specified in `options.schema` constructor argument', options.schema);
    this.schema = options.schema;

    Source.created(this);
  },

  /////////////////////////////////////////////////////////////////////////////
  // Queryable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _query: required,

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  /**
   Internal method that applies an array of transforms to this source.

   `_transform` must be implemented by a `Transformable` source.
   It is called by the public method `transform` in order to actually apply
   transforms.

   For synchronous transforms, `_transform` should return a TransformResult.

   For asynchronous transforms, `_transform` should return a promise that
   resolves to a TransformResult.

   @method _transform
   @param {Transform} [transform] An Orbit.Transform object
   @returns {Promise | TransformResult} An Orbit.TransformResult or Promise that resolves to a Orbit.TransformResult
   @private
   */
  _transform: required
});

/**
 * A place to track the creation of any Source, is called in the Source init
 * method.  The source might not be fully configured / setup by the time you
 * receive it, but we provide this hook for potential debugging tools to monitor
 * all sources.
 *
 * @namespace OC
 * @param {OC.Source} source The newly forged Source.
 */
Source.created = function(/* source */) {};

export default Source;
