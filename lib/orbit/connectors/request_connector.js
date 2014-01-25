import Orbit from 'orbit/main';
import Requestable from 'orbit/requestable';
import { arrayToOptions } from 'orbit/utils/config';

var RequestConnector = function(primarySource, secondarySource, options) {
  var _this = this;

  this.primarySource = primarySource;
  this.secondarySource = secondarySource;

  options = options || {};

  this.actions = options.actions || Requestable.defaultActions;
  if (options.types) this.types = arrayToOptions(options.types);

  this.mode = options.mode !== undefined ? options.mode : 'rescue';
  Orbit.assert("`mode` must be 'assist' or 'rescue'", this.mode === 'assist' ||
                                                      this.mode === 'rescue');

  var active = options.active !== undefined ? options.active : true;
  if (active) this.activate();
};

RequestConnector.prototype = {
  constructor: RequestConnector,

  activate: function() {
    var _this = this,
        handler;

    if (this._active) return;

    this.handlers = {};

    this.actions.forEach(function(action) {
      if (_this.types) {
        handler = function(type) {
          if (_this.types[type]) {
            return _this.secondarySource[action].apply(_this.secondarySource, arguments);
          }
        };
      } else {
        handler = _this.secondarySource[action];
      }

      _this.primarySource.on(_this.mode + Orbit.capitalize(action),
        handler,
        _this.secondarySource
      );

      _this.handlers[action] = handler;
    });

    this._active = true;
  },

  deactivate: function() {
    var _this = this;

    this.actions.forEach(function(action) {
      this.primarySource.off(_this.mode + Orbit.capitalize(action),
        _this.handlers[action],
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