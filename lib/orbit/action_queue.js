import Orbit from 'orbit/main';
import Evented from 'orbit/evented';
import { assert } from 'orbit/lib/assert';

var ActionQueue = function() {
  this.init.apply(this, arguments);
};

ActionQueue.prototype = {
  constructor: ActionQueue,

  init: function(fn, context, options) {
    assert('ActionQueue requires Orbit.Promise to be defined', Orbit.Promise);

    Evented.extend(this);

    this.fn = fn;
    this.context = context || this;

    options = options || {};
    this.autoProcess = options.autoProcess !== undefined ? options.autoProcess : true;

    this._queue = [];
    this.processing = false;
  },

  push: function() {
    var _this = this,
        args = arguments;

    var response = new Orbit.Promise(function(resolve) {
      var action = function() {
        var ret = _this.fn.apply(_this.context, args);
        if (ret) {
          return ret.then(
            function() {
              resolve();
            }
          );
        } else {
          resolve();
        }
      };

      _this._queue.push(action);
    });

    if (this.autoProcess) this.process();

    return response;
  },

  process: function() {
    if (!this.processing) {
      var _this = this;

      _this.processing = true;

      var settleEach = function() {
        if (_this._queue.length === 0) {
          _this.processing = false;
          _this.emit('didComplete');

        } else {
          var action = _this._queue.shift();
          var ret = action.call(_this);

          if (ret) {
            return ret.then(
              function(success) {
                settleEach();
              },
              function(error) {
                settleEach();
              }
            );
          } else {
            settleEach();
          }
        }
      };

      settleEach();
    }
  }
};

export default ActionQueue;