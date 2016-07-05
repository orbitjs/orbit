import { assert } from 'orbit/lib/assert';
import Transformable from 'orbit/transformable';

/**
 Base class for sources.

 @class Source
 @namespace OC
 @param {Object}    options - Options for source
 @param {OC.Schema} options.schema - Schema for source
 @param {String}    options.name - Name for source
 @constructor
 */
export default class Source {
  constructor({ schema, name }) {
    assert('Source\'s `schema` must be specified in `options.schema` constructor argument', schema);

    this.schema = schema;
    this.name   = name;

    Transformable.extend(this);
  }

  /**
   Truncates the Source's logged and tracked transforms to remove everything
   before a particular `transformId`.

   @method truncateHistory
   @param {string} transformId - The ID of the transform to truncate history to.
   @returns {undefined}
  */
  truncateHistory(transformId) {
    this.transformLog.truncate(transformId);
  }

  /**
   Clears the Source's logged and tracked transforms entirely.

   @method clearHistory
   @returns {undefined}
  */
  clearHistory() {
    this.transformLog.clear();
  }
}
