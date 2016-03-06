import Orbit from 'orbit/main';
import Transformable from 'orbit/transformable';
import { assert } from 'orbit/lib/assert';
import TransformBuilder from './transform/builder';

/**
 `Source` is an abstract base class to be extended by other sources.

 @class Source
 @namespace OC
 @param {Object}    [options]
 @param {OC.Schema} [options.schema] Schema for source (required)
 @constructor
*/
export default class Source {
  constructor(options) {
    assert('Source constructor requires `options`', options);
    assert('Source\'s `schema` must be specified in `options.schema` constructor argument', options.schema);

    this.schema = options.schema;

    Transformable.extend(this);
    this.transformBuilder = new TransformBuilder();

    Source.created(this);
  }
}

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
