import Orbit from './main';
import Evented from './evented';
import { Class } from './lib/objects';

/**
 `Action` provides a wrapper for actions that are performed in an `ActionQueue`.

 Actions can maintain optional metadata such as `id` and `data`. This metadata
 makes it easier to identify actions within a queue. It can also be used by
 actions themselves during processing.

 Each Action is associated with a function that should be invoked. This function
 can be synchronous or asynchronous.

 `process` wraps the call to the function with a promise.

 Each Action can only succeed once. On failure, the `processing` promise will
 be reset and the action can be tried again.

 @class Action
 @namespace Orbit
 @param {Object}    [options]
 @param {Object}    [options.id] Optional identifier
 @param {Object}    [options.data] Optional data
 @param {Object}    [options.process] A function that performs the action
 @constructor
 */
export default Class.extend({
  id: null,
  data: null,
  _process: null,

  processing: false,
  complete: null,

  init: function(options) {
    Evented.extend(this);

    this.id = options.id;
    this.data = options.data;
    this._process = options.process;

    this.reset();
  },

  reset: function() {
    var _this = this;

    this.processing = false;

    this.complete = new Orbit.Promise(function(resolve, reject) {
      _this.one('didProcess', function() {
        resolve();
      });
      _this.one('didNotProcess', function(e) {
        _this.processing = false;
        reject(e);
      });
    });
  },

  process: function() {
    var _this = this;

    if (!this.processing) {
      this.processing = true;

      var didProcess = function() {
        _this.emit('didProcess');
      };

      var didNotProcess = function(e) {
        _this.emit('didNotProcess', e);
      };

      try {
        var ret = _this._process.call(_this);
        if (ret) {
          ret.then(didProcess, didNotProcess);
        } else {
          didProcess();
        }

      } catch(e) {
        didNotProcess(e);
      }
    }

    return this.complete;
  }
});
