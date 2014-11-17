import Requestable from './requestable';
import { assert } from './lib/assert';
import { arrayToOptions } from './lib/config';
import { Class } from './lib/objects';
import { capitalize } from './lib/strings';

/**
 A `RequestConnector` observes requests made to a primary source and allows a
 secondary source to either "assist" or "rescue" those requests.

 A `RequestConnector` can operate in one of two modes:

 - In the default `"rescue"` mode, the secondary source will only be called upon
 to fulfill a request if the primary source fails to do so.

 - In `"assist"` mode, the secondary source will be called upon to fulfill a
 request before the primary source. Only if the secondary source fails to
 fulfill the request will the primary source be called upon to do so.

 Unlike a `TransformConnector`, a `RequestConnector` always blocks
 asynchronous requests before proceeding. In other words, any promises that
 are returned from requests will be settled (either succeeding or failing)
 before the connector proceeds.

 @class RequestConnector
 @namespace Orbit
 @param {Object}  primarySource
 @param {Object}  secondarySource
 @param {Object}  [options]
 @param {String}  [options.mode="rescue"] Mode of operation: `"rescue"` or `"assist"`
 @param {Boolean} [options.active=true] Is the connector is actively observing the `primarySource`?
 @constructor
 */
var RequestConnector = Class.extend({
  init: function(primarySource, secondarySource, options) {
    this.primarySource = primarySource;
    this.secondarySource = secondarySource;

    options = options || {};

    this.actions = options.actions || Requestable.defaultActions;
    if (options.types) this.types = arrayToOptions(options.types);

    this.mode = options.mode !== undefined ? options.mode : 'rescue';
    assert("`mode` must be 'assist' or 'rescue'", this.mode === 'assist' ||
                                                  this.mode === 'rescue');

    var active = options.active !== undefined ? options.active : true;
    if (active) this.activate();
  },

  activate: function() {
    if (this._active) return;

    if (!this.handlers) {
      this.handlers = {};
    }

    this.actions.forEach(function(action) {
      var handler = this.handlers[action] || this._handlerFor(action);

      this.primarySource.on(this.mode + capitalize(action),
        handler,
        this.secondarySource
      );

      this.handlers[action] = handler;
    }, this);

    this._active = true;
  },

  deactivate: function() {
    var _this = this;

    this.actions.forEach(function(action) {
      _this.primarySource.off(_this.mode + capitalize(action),
        _this.handlers[action],
        _this.secondarySource
      );
    });

    this._active = false;
  },

  isActive: function() {
    return this._active;
  },

  /**
   * Should return the handler for a Requestable action.
   *
   * @param {String} action - I.E. 'find', 'findLink'
   * @returns {Function} handler to call for that action
   */
  _handlerFor: function(action) {
    if (!this.types) {
      return this.secondarySource[action];
    }

    var _this = this;
    return function filterRequestByType(type) {
      if (_this.types[type]) {
        return _this.secondarySource[action].apply(_this.secondarySource, arguments);
      }
    };
  }
});

export default RequestConnector;
