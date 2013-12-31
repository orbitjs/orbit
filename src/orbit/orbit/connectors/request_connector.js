import Orbit from 'orbit/core';
import Requestable from 'orbit/requestable';

var RequestConnector = function(primarySource, secondarySource, options) {
  var _this = this;

  this.primarySource = primarySource;
  this.secondarySource = secondarySource;

  options = options || {};

  this.actions = options.actions || Requestable.defaultActions;
  if (options.types) this.types = Orbit.arrayToOptions(options.types);

  this.mode = options.mode !== undefined ? options.mode : 'rescue';
  Orbit.assert("`mode` must be 'assist' or 'rescue'", this.mode === 'assist' ||
                                                      this.mode === 'rescue');

  this.blocking = options.blocking !== undefined ? options.blocking : true;

  var active = options.active !== undefined ? options.active : true;
  if (active) this.activate();
};

RequestConnector.prototype = {
  constructor: RequestConnector,

  activate: function() {
    var _this = this;

    if (this._active) return;

    this.actions.forEach(function(action) {
      _this.primarySource.on(_this.mode + Orbit.capitalize(action),
        _this.secondarySource[action],
        _this.secondarySource
      );
    });

    this._active = true;
  },

  deactivate: function() {
    var _this = this;

    this.actions.forEach(function(action) {
      this.primarySource.off(_this.mode + Orbit.capitalize(action),
        _this.secondarySource[action],
        _this.secondarySource
      );
    });

    this._active = false;
  },

  isActive: function() {
    return this._active;
  }
};

export default RequestConnector;