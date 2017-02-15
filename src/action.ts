/* eslint-disable valid-jsdoc */
import Orbit from './main';

export interface ActionOptions {
  meta?: any;
  data?: any;
}

export interface SerializedAction {
  method: string;
  meta: any;
  data: any;  
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
export default class Action {
  target: any;
  method: string;
  meta: any;
  data: any;

  private _started: boolean;
  private _settled: boolean;
  private _resolution: Promise<any>;
  private _success: (resolution: any) => void;
  private _fail: (e: Error) => void;

  /**
   * Constructor for `Action` class.
   *
   * @param  {Object} target         Target object
   * @param  {String} method         Name of method to call on `target`
   * @param  {Object} [options={}]   Options
   * @param  {Any}    [options.meta] Optional metadata
   * @param  {Any}    [options.data] Optional data to send as an arg when calling `method`
   * @constructor
   */
  constructor(target, method, options?: ActionOptions) {
    this.target = target;
    this.method = method;
    if (options) {
      this.meta = options.meta;
      this.data = options.data;
    }

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
        const method = this.target[this.method];

        let ret;
        if (this.data) {
          ret = method.call(this.target, this.data);
        } else {
          ret = method.call(this.target);
        }

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

  serialize(): SerializedAction {
    const { method, data, meta } = this;
    return { method, data, meta };
  }

  static deserialize(target, serialized: SerializedAction) {
    return new Action(target, serialized.method, {
      data: serialized.data,
      meta: serialized.meta
    });
  }
}
