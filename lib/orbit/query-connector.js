import Queryable from './queryable';
import { assert } from './lib/assert';
import { arrayToOptions } from './lib/config';
import { Class } from './lib/objects';
import { capitalize } from './lib/strings';

/**
 A `QueryConnector` observes query requests made to a primary source and allows
 a secondary source to either "assist" or "rescue" those requests.

 A `QueryConnector` can operate in one of two modes:

 - In the default `"rescue"` mode, the secondary source will only be called upon
 to fulfill a request if the primary source fails to do so.

 - In `"assist"` mode, the secondary source will be called upon to fulfill a
 request before the primary source. Only if the secondary source fails to
 fulfill the request will the primary source be called upon to do so.

 Unlike a `TransformConnector`, a `QueryConnector` always blocks
 asynchronous requests before proceeding. In other words, any promises that
 are returned from requests will be settled (either succeeding or failing)
 before the connector proceeds.

 @class QueryConnector
 @namespace Orbit
 @param {Object}  primarySource
 @param {Object}  secondarySource
 @param {Object}  [options]
 @param {String}  [options.mode="rescue"] Mode of operation: `"rescue"` or `"assist"`
 @param {Boolean} [options.active=true] Is the connector is actively observing the `primarySource`?
 @constructor
 */
var QueryConnector = Class.extend({
  init: function(primarySource, secondarySource, options) {
    this.primarySource = primarySource;
    this.secondarySource = secondarySource;

    options = options || {};

    if (options.types) this.types = arrayToOptions(options.types);

    this.mode = options.mode !== undefined ? options.mode : 'rescue';
    assert("`mode` must be 'assist' or 'rescue'", this.mode === 'assist' ||
                                                  this.mode === 'rescue');

    var active = options.active !== undefined ? options.active : true;
    if (active) this.activate();
  },

  activate: function() {
    if (this._active) return;

    this.primarySource.on(this.mode + 'Query',
      this.secondarySource.query,
      this.secondarySource
    );

    this._active = true;
  },

  deactivate: function() {
    if (!this._active) return;

    this.primarySource.off(this.mode + 'Query',
      this.secondarySource.query,
      this.secondarySource
    );

    this._active = false;
  },

  isActive: function() {
    return this._active;
  }
});

export default QueryConnector;
