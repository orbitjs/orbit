/* eslint-disable valid-jsdoc */
import Orbit from './main';
import Action from './action';
import Evented from './evented';
import { assert } from './lib/assert';

/**
 `ActionQueue` is a FIFO queue of actions that should be performed sequentially.

 Actions are added to the queue with `push`. Each action will be processed by
 calling its `process` method.

 If action calls return a promise, then that promise will be settled before the
 next action is de-queued and called. If action calls don't return anything,
 then the next action will be de-queued and called immediately.

 By default, ActionQueues will be processed automatically, as soon as actions
 are pushed to them. This can be overridden by setting the `autoProcess` option
 to `false` and then by calling `process` when you'd like to start processing.

 @example

 ``` javascript
 var transform = function(operation) {
   // perform operation here
 };

 var queue = new ActionQueue();

 // push operations into queue synchronously so that they'll be performed
 // sequentially
 queue.push({
   process: function() { transform(this.data); },
   data: {op: 'add', path: ['planets', '123'], value: 'Mercury'}
 });
 queue.push({
   process: function() { transform(this.data); },
   data: {op: 'add', path: ['planets', '234'], value: 'Venus'}
 });
 ```

 @class ActionQueue
 @namespace Orbit
 @param {Object}   [options]
 @param {Boolean}  [options.autoProcess=true] Are actions automatically
                   processed as soon as they are pushed?
 @constructor
 */
export default class ActionQueue {
  constructor(options) {
    assert('ActionQueue requires Orbit.Promise to be defined', Orbit.Promise);

    options = options || {};
    this.autoProcess = options.autoProcess !== undefined ? options.autoProcess : true;

    this._resolution = null;
    this.actions = [];
  }

  push(action) {
    let actionObject;

    if (action instanceof Action) {
      actionObject = action;
    } else {
      actionObject = new Action(action);
    }

    this.actions.push(actionObject);

    if (this.autoProcess) { this.process(); }

    return actionObject;
  }

  process() {
    if (!this._resolution) {
      if (this.actions.length === 0) {
        this._resolution = Orbit.Promise.resolve();
      } else {
        this._resolution = new Orbit.Promise((resolve, reject) => {
          this.one('complete', () => resolve());

          this.one('fail', (action, e) => {
            reject(e);
          });
        });

        this._settleEach();
      }
    }

    return this._resolution;
  }

  _settleEach() {
    if (this.actions.length === 0) {
      this._resolution = null;
      this.emit('complete');
    } else {
      let action = this.actions[0];

      this.emit('beforeAction', action);

      action.process()
        .then(() => {
          this.emit('action', action);
          this.actions.shift();
          this._settleEach();
        })
        .catch((e) => {
          this._resolution = null;
          this.emit('fail', action, e);
        });
    }
  }
}

Evented.extend(ActionQueue.prototype);
