/* eslint-disable valid-jsdoc */
import Orbit from './main';
import { Action, ActionProcessor } from './action';
import { Bucket } from './bucket';
import evented, { Evented } from './evented';
import { assert } from '@orbit/utils';

export interface ActionQueueOptions {
  name?: string;
  bucket?: Bucket;
  autoProcess?: boolean;
}

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
 @constructor
*/
@evented
export default class ActionQueue implements Evented {
  public autoProcess: boolean;

  private _name: string;
  private _target: object;
  private _bucket: Bucket;
  private _actions: Action[];
  private _processors: ActionProcessor[];
  private _error: any;
  private _resolution: Promise<void>;
  private _resolve: any;
  private _reject: any;
  private _reified: Promise<any>;

  // Evented interface stubs
  on: (event: string, callback: any, binding?: any) => void;
  off: (event: string, callback: any, binding?: any) => void;
  one: (event: string, callback: any, binding?: any) => void;
  emit: (event: string, ...args) => void;
  listeners: (event: string) => any[];

  constructor(target: object, options: ActionQueueOptions = {}) {
    assert('ActionQueue requires Orbit.Promise to be defined', Orbit.Promise);

    this._target = target;
    this._name = options.name;
    this._bucket = options.bucket;
    this.autoProcess = options.autoProcess === undefined ? true : options.autoProcess;

    if (this._bucket) {
      assert('ActionQueue requires a name if it has a bucket', !!this._name);
    }
    
    this._reify()
      .then(() => {
        if (this.length > 0 && this.autoProcess) {
          this.process();
        }
      });
  }

  get name(): string {
    return this._name;
  }

  get target(): any {
    return this._target;
  }

  get bucket(): Bucket {
    return this._bucket;
  }

  get length(): number {
    return this._actions ? this._actions.length : 0;
  }

  get current(): Action {
    return this._actions && this._actions[0];
  }

  get currentProcessor(): ActionProcessor {
    return this._processors && this._processors[0];
  }

  get error(): any {
    return this._error;
  }

  get complete(): boolean {
    return this.length === 0;
  }

  get processing(): boolean {
    const processor = this.currentProcessor;

    return processor !== undefined &&
           processor.started &&
           !processor.settled;
  }

  get reified(): Promise<void> {
    return this._reified;
  }

  push(action: Action): Promise<void> {
    let processor = new ActionProcessor(this._target, action);
    return this._reified
      .then(() => {
        this._actions.push(action);
        this._processors.push(processor);
        return this._persist();
      })
      .then(() => {
        if (this.autoProcess) {
          return this.process()
            .then(() => processor.settle());
        } else {
          return processor.settle();
        }
      });
  }

  retry(): Promise<void> {
    return this._reified
      .then(() => {
        this._cancel();
        this.currentProcessor.reset();
        return this._persist();
      })
      .then(() => this.process());
  }

  skip(): Promise<void> {
    return this._reified
      .then(() => {
        this._cancel();
        this._actions.shift();
        this._processors.shift();
        return this._persist();
      })
      .then(() => this.process());
  }

  clear(): Promise<void> {
    return this._reified
      .then(() => {
        this._cancel();
        this._actions = [];
        this._processors = [];
        return this._persist();
      })
      .then(() => this.process());
  }

  shift(): Promise<Action> {
    let action: Action;

    return this._reified
      .then(() => {
        this._cancel();
        action = this._actions.shift();
        this._processors.shift();
        return this._persist();
      })
      .then(() => action);
  }

  unshift(action: Action): Promise<void> {
    return this._reified
      .then(() => {
        this._cancel();
        this._actions.unshift(action);
        this._processors.unshift(new ActionProcessor(this._target, action));
        return this._persist();
      });
  }

  process(): Promise<any> {
    return this._reified
      .then(() => {
        let resolution = this._resolution;

        if (!resolution) {
          if (this._actions.length === 0) {
            resolution = Orbit.Promise.resolve();
            this._complete();
          } else {
            this._error = null;
            this._resolution = resolution = new Orbit.Promise((resolve, reject) => {
              this._resolve = resolve;
              this._reject = reject;
            });
            this._settleEach(resolution);
          }
        }

        return resolution;
      });
  }

  private _complete(): void {
    if (this._resolve) {
      this._resolve();
    }
    this._resolve = null;
    this._reject = null;
    this._error = null;
    this._resolution = null;
    this.emit('complete');
  }

  private _fail(action, e): void {
    if (this._reject) {
      this._reject(e);
    }
    this._resolve = null;
    this._reject = null;
    this._error = e;
    this._resolution = null;
    this.emit('fail', action, e);
  }

  private _cancel(): void {
    this._error = null;
    this._resolution = null;
  }

  private _settleEach(resolution): void {
    if (this._actions.length === 0) {
      this._complete();
    } else {
      let action = this._actions[0];
      let processor = this._processors[0];

      this.emit('beforeAction', action);

      processor.process()
        .then((result) => {
          if (resolution === this._resolution) {
            this._actions.shift();
            this._processors.shift();

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

  private _reify(): Promise<void> {
    this._actions = [];
    this._processors = [];

    if (this._bucket) {
      this._reified = this._bucket.getItem(this._name)
        .then(actions => {
          if (actions) {
            this._actions = actions;
            this._processors = actions.map(action => new ActionProcessor(this._target, action));
          }
        });
    } else {
      this._reified = Orbit.Promise.resolve();
    }

    return this._reified;
  }

  private _persist(): Promise<void> {
    if (this._bucket) {
      return this._bucket.setItem(this._name, this._actions);
    } else {
      return Orbit.Promise.resolve();
    }
  }
}
