import Orbit from './main';
import { Action, Actionable } from './action';

/**
 `ActionProcessor` peforms actions in an `ActionQueue`.

 Actions can maintain optional metadata such as `id` and `data`. This metadata
 makes it easier to identify actions within a queue. It can also be used by
 actions themselves during processing.

 Each Action is associated with a function that should be invoked. This function
 can be synchronous or asynchronous.

 `process` wraps the call to the function with a promise.

 Each Action can only succeed once. On failure, the `processing` promise will
 be reset and the action can be tried again.

 @class ActionProcessor
 */
export default class ActionProcessor {
  target: Actionable;
  action: Action;

  private _started: boolean;
  private _settled: boolean;
  private _resolution: Promise<any>;
  private _success: (resolution: any) => void;
  private _fail: (e: Error) => void;

  /**
   * Constructor for `ActionProcessor` class.
   *
   * @param {Actionable} target Target that performs actions
   * @param {Action} action Action
   * @constructor
   */
  constructor(target: Actionable, action: Action) {
    this.target = target;
    this.action = action;

    this.reset();
  }

  reset(): void {
    this._started = false;
    this._settled = false;
    this._resolution = new Orbit.Promise((resolve, reject) => {
      this._success = (r) => {
        this._settled = true;
        resolve(r);
      };

      this._fail = (e) => {
        this._settled = true;
        reject(e);
      };
    });
  }

  get started(): boolean {
    return this._started;
  }

  get settled(): boolean {
    return this._settled;
  }

  settle(): Promise<any> {
    return this._resolution;
  }

  process(): Promise<any> {
    if (!this._started) {
      this._started = true;

      this.target.perform(this.action)
        .then(this._success, this._fail);
    }

    return this.settle();
  }
}
