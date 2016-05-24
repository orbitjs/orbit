import Orbit from './main';
import Evented from './evented';

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
export default class Action {
  constructor(options) {
    Evented.extend(this);

    this.id = options.id;
    this.data = options.data;
    this._process = options.process;

    this.reset();
  }

  reset() {
    this.processing = false;

    this.complete = new Orbit.Promise((resolve, reject) => {
      this.one('didProcess', (...args) => {
        resolve(...args);
      });
      this.one('didNotProcess', (e) => {
        this.processing = false;
        reject(e);
      });
    });
  }

  process() {
    if (!this.processing) {
      this.processing = true;

      try {
        let ret = this._process();
        if (ret) {
          if (ret.then) {
            ret
              .then((...args) => this.didProcess(...args))
              .catch(err => this.didNotProcess(err));
          } else {
            this.didProcess(ret);
          }
        } else {
          this.didProcess();
        }
      } catch(e) {
        this.didNotProcess(e);
      }
    }

    return this.complete;
  }

  didProcess(...args) {
    this.emit('didProcess', ...args);
  }

  didNotProcess(e) {
    this.emit('didNotProcess', e);
  }
}
