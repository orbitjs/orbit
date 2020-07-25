import { Task, Performer } from './task';

/**
 * A `TaskProcessor` performs a `Task` by calling `perform()` on its target.
 * This is triggered by calling `process()` on the processor.
 *
 * A processor maintains a promise that represents the eventual state (resolved
 * or rejected) of the task. This promise is created upon construction, and
 * will be returned by calling `settle()`.
 *
 * A task can be re-tried by first calling `reset()` on the processor. This
 * will clear the processor's state and allow `process()` to be invoked again.
 */
export class TaskProcessor {
  target: Performer;
  task: Task;

  private _started: boolean;
  private _settled: boolean;
  private _settlement: Promise<any>;
  private _success: (resolution: any) => void;
  private _fail: (e: Error) => void;

  /**
   * Creates an instance of TaskProcessor.
   */
  constructor(target: Performer, task: Task) {
    this.target = target;
    this.task = task;

    this.reset();
  }

  /**
   * Clears the processor state, allowing for a fresh call to `process()`.
   */
  reset(): void {
    this._started = false;
    this._settled = false;
    this._settlement = new Promise((resolve, reject) => {
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

  /**
   * Has `process` been invoked?
   */
  get started(): boolean {
    return this._started;
  }

  /**
   * Has promise settled, either via `process` or `reject`?
   */
  get settled(): boolean {
    return this._settled;
  }

  /**
   * The eventual result of processing.
   */
  settle(): Promise<any> {
    return this._settlement;
  }

  /**
   * Invokes `perform` on the target.
   */
  process(): Promise<any> {
    if (!this._started) {
      this._started = true;

      this.target.perform(this.task).then(this._success, this._fail);
    }

    return this.settle();
  }

  /**
   * Reject the current promise with a specific error.
   *
   * @param e Error associated with rejection
   */
  reject(e: Error): void {
    if (this._settled) {
      throw new Error(
        'TaskProcessor#reject can not be invoked when processing has already settled.'
      );
    } else {
      this._fail(e);
    }
  }
}
