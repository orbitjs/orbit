import Orbit from './main';

export interface Action {
  method: string;
  data?: any;
}

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
 */
export class ActionProcessor {
  target: object;
  action: Action;

  private _started: boolean;
  private _settled: boolean;
  private _resolution: Promise<any>;
  private _success: (resolution: any) => void;
  private _fail: (e: Error) => void;

  /**
   * Constructor for `Action` class.
   *
   * @param {object} target Target object
   * @param {Action} action Action
   * @constructor
   */
  constructor(target: object, action: Action) {
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

      try {
        const method = this.target[this.action.method];

        let ret = method.call(this.target, this.action.data);

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
