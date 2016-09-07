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
  constructor(target, options = {}) {
    assert('ActionQueue requires Orbit.Promise to be defined', Orbit.Promise);

    this.target = target;

    this.name = options.name;
    this.bucket = options.bucket;
    this.autoProcess = options.autoProcess !== undefined ? options.autoProcess : true;
    this._reify()
      .then(() => {
        if (this.length > 0 && this.autoProcess) {
          this.process();
        }
      });
  }

  get length() {
    return this._actions.length;
  }

  get current() {
    return this._actions[0];
  }

  get error() {
    return this._error;
  }

  get complete() {
    return this.length === 0;
  }

  get processing() {
    const current = this.current;

    return current !== undefined &&
           current.started &&
           !current.settled;
  }

  push(method, options) {
    return this.reified
      .then(() => {
        const action = new Action(this.target, method, options);
        this._actions.push(action);
        return this._persist()
          .then(() => {
            if (this.autoProcess) {
              return this.process()
                .then(() => action);
            } else {
              return action;
            }
          });
      });
  }

  retry() {
    return this.reified
      .then(() => {
        this._cancel();
        this.current.reset();
        return this._persist();
      })
      .then(() => this.process());
  }

  skip() {
    return this.reified
      .then(() => {
        this._cancel();
        this._actions.shift();
        return this._persist();
      })
      .then(() => this.process());
  }

  clear() {
    return this.reified
      .then(() => {
        this._cancel();
        this._actions = [];
        return this._persist();
      })
      .then(() => this.process());
  }

  shift() {
    let action;

    return this.reified
      .then(() => {
        this._cancel();
        action = this._actions.shift();
        return this._persist();
      })
      .then(() => action);
  }

  unshift(method, options) {
    let action;

    return this.reified
      .then(() => {
        action = new Action(this.target, method, options);
        this._cancel();
        this._actions.unshift(action);
        return this._persist();
      })
      .then(() => action);
  }

  process() {
    return this.reified
      .then(() => {
        let resolution = this._resolution;

        if (!resolution) {
          if (this._actions.length === 0) {
            resolution = Orbit.Promise.resolve();
            this._complete();
          } else {
            this._error = null;
            this._resolution = resolution = new Orbit.Promise((resolve) => {
              this._resolve = resolve;
            });
            this._settleEach(resolution);
          }
        }

        return resolution;
      });
  }

  _complete() {
    if (this._resolve) {
      this._resolve();
    }
    this._error = null;
    this._resolution = null;
    this.emit('complete');
  }

  _fail(action, e) {
    if (this._resolve) {
      this._resolve();
    }
    this._error = e;
    this._resolution = null;
    this.emit('fail', action, e);
  }

  _cancel() {
    this._error = null;
    this._resolution = null;
  }

  _settleEach(resolution) {
    if (this._actions.length === 0) {
      this._complete();
    } else {
      let action = this._actions[0];

      this.emit('beforeAction', action);

      action.process()
        .then(() => {
          if (resolution === this._resolution) {
            this._actions.shift();
            this._persist()
              .then(() => {
                this.emit('action', action);
                this._settleEach(resolution);
              });
          }
        })
        .catch((e) => {
          if (resolution === this._resolution) {
            this._fail(action, e);
          }
        });
    }
  }

  _reify() {
    this._actions = [];

    if (this.bucket) {
      this.reified = this.bucket.getItem(this.name)
        .then(serialized => this._deserializeActions(serialized));
    } else {
      this.reified = Orbit.Promise.resolve();
    }

    return this.reified;
  }

  _deserializeActions(serialized) {
    if (serialized) {
      this._actions = serialized.map(a => Action.deserialize(this.target, a));
    } else {
      this._actions = [];
    }
  }

  _serializeActions() {
    return this._actions.map(a => a.serialize());
  }

  _persist() {
    if (this.bucket) {
      return this.bucket.setItem(this.name, this._serializeActions());
    } else {
      return Orbit.Promise.resolve();
    }
  }
}

Evented.extend(ActionQueue.prototype);
