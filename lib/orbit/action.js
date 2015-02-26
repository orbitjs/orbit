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

 `process` wraps the call to the function with a promise. The same promise will
 always be returned on subsequent calls to `process`.

 Each Action can only be performed once.

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
  processing: null,
  processed: false,

  init: function(options) {
    Evented.extend(this);

    this.id = options.id;
    this.data = options.data;
    this._process = options.process;
  },

  process: function() {
    var _this = this;
    var processing = this.processing;

    if (!processing) {
      var ret = this._process.call(this);

      var didComplete = function() {
        _this.processed = true;
        _this.emit('complete');
      };

      processing = this.processing = new Orbit.Promise(function(resolve) {
        _this.one('complete', function () {
          resolve();
        });
      });

      if (ret) {
        ret.then(didComplete, didComplete);
      } else {
        didComplete();
      }
    }

    return processing;
  }
});
