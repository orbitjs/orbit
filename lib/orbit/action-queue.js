import Orbit from './main';
import Evented from './evented';
import { assert } from './lib/assert';
import { Class } from './lib/objects';

/**
 `ActionQueue` is a FIFO queue of actions that should be performed sequentially.

 All actions are calls to the same function and context. However, arguments for
 each call can vary in both value and length.

 If action calls return a promise, then that promise will be settled before the
 next action is de-queued and called. If action calls don't return anything,
 then the next action will be de-queued and called immediately.

 @example

 ``` javascript
 var transform = function(operation) {
   // perform operation here
 };

 var queue = new ActionQueue(transform);

 // push operations into queue synchronously so that they'll be performed
 // sequentially
 queue.push({op: 'add', path: ['planets', '123'], value: 'Mercury'});
 queue.push({op: 'add', path: ['planets', '234'], value: 'Venus'});
 ```

 @class ActionQueue
 @namespace Orbit
 @param {Function} fn Function to be called in order to process actions
 @param {Object}   [context] Context in which `fn` should be called
 @param {Object}   [options]
 @param {Boolean}  [options.autoProcess=true] Are actions automatically
                   processed as soon as they are pushed?
 @constructor
 */
var ActionQueue = Class.extend({
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
  },

  then: function(success, failure) {
    var self = this;

    return new Orbit.Promise(function(resolve) {
      if (self.processing) {
        self.one('didComplete', function () {
          resolve();
        });
      } else {
        resolve();
      }
    }).then(success, failure);
  }
});

export default ActionQueue;