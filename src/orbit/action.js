/* eslint-disable valid-jsdoc */
import Orbit from 'orbit';

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
    this.id = options.id;
    this.data = options.data;
    this._process = options.process;
    this._started = false;
    this._resolution = new Orbit.Promise((resolve, reject) => {
      this._success = resolve;
      this._fail = (e) => {
        reject(e);
      };
    });
  }

  settle() {
    return this._resolution;
  }

  process() {
    if (!this._started) {
      this._started = true;

      try {
        let ret = this._process();

        if (ret && ret.then) {
          ret.then(this._success, this._fail);
        } else {
          this._success(ret);
        }
      } catch (e) {
        this._fail(e);
      }
    }

    return this.settle();
  }
}

Action.from = function(actionOrOptions) {
  if (actionOrOptions instanceof Action) {
    return actionOrOptions;
  } else {
    return new Action(actionOrOptions);
  }
};
