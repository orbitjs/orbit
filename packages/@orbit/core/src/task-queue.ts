/* eslint-disable valid-jsdoc */
import Orbit from './main';
import { Task, Performer } from './task';
import TaskProcessor from './task-processor';
import { Bucket } from './bucket';
import evented, { Evented } from './evented';
import { assert } from '@orbit/utils';

/**
 * Options for `TaskQueue`
 * 
 * @export
 * @interface TaskQueueOptions
 */
export interface TaskQueueOptions {
  name?: string;
  bucket?: Bucket;
  autoProcess?: boolean;
}

/**
 * `TaskQueue` is a FIFO queue of asynchronous tasks that should be
 * performed sequentially.
 *
 * Tasks are added to the queue with `push`. Each task will be processed by
 * calling its `process` method.
 *
 * By default, TaskQueues will be processed automatically, as soon as tasks
 * are pushed to them. This can be overridden by setting the `autoProcess`
 * option to `false` and then by calling `process` when you'd like to start
 * processing.
 *
 * @export
 * @class TaskQueue
 * @implements {Evented}
 */
@evented
export default class TaskQueue implements Evented {
  public autoProcess: boolean;

  private _name: string;
  private _target: Performer;
  private _bucket: Bucket;
  private _tasks: Task[];
  private _processors: TaskProcessor[];
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

  /**
   * Creates an instance of TaskQueue.
   * 
   * @param {Taskable} target 
   * @param {TaskQueueOptions} [options={}] 
   * 
   * @memberOf TaskQueue
   */
  constructor(target: Performer, options: TaskQueueOptions = {}) {
    assert('TaskQueue requires Orbit.Promise to be defined', Orbit.Promise);

    this._target = target;
    this._name = options.name;
    this._bucket = options.bucket;
    this.autoProcess = options.autoProcess === undefined ? true : options.autoProcess;

    if (this._bucket) {
      assert('TaskQueue requires a name if it has a bucket', !!this._name);
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
    return this._tasks ? this._tasks.length : 0;
  }

  get entries(): Task[] {
    return this._tasks;
  }

  get current(): Task {
    return this._tasks && this._tasks[0];
  }

  get currentProcessor(): TaskProcessor {
    return this._processors && this._processors[0];
  }

  get error(): any {
    return this._error;
  }

  /**
   * Is the queue empty?
   * 
   * @readonly
   * @type {boolean}
   * @memberOf TaskQueue
   */
  get empty(): boolean {
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

  push(task: Task): Promise<void> {
    let processor = new TaskProcessor(this._target, task);
    return this._reified
      .then(() => {
        this._tasks.push(task);
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
        this._tasks.shift();
        this._processors.shift();
        return this._persist();
      })
      .then(() => this.process());
  }

  clear(): Promise<void> {
    return this._reified
      .then(() => {
        this._cancel();
        this._tasks = [];
        this._processors = [];
        return this._persist();
      })
      .then(() => this.process());
  }

  shift(): Promise<Task> {
    let task: Task;

    return this._reified
      .then(() => {
        this._cancel();
        task = this._tasks.shift();
        this._processors.shift();
        return this._persist();
      })
      .then(() => task);
  }

  unshift(task: Task): Promise<void> {
    return this._reified
      .then(() => {
        this._cancel();
        this._tasks.unshift(task);
        this._processors.unshift(new TaskProcessor(this._target, task));
        return this._persist();
      });
  }

  process(): Promise<any> {
    return this._reified
      .then(() => {
        let resolution = this._resolution;

        if (!resolution) {
          if (this._tasks.length === 0) {
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

  private _fail(task, e): void {
    if (this._reject) {
      this._reject(e);
    }
    this._resolve = null;
    this._reject = null;
    this._error = e;
    this._resolution = null;
    this.emit('fail', task, e);
  }

  private _cancel(): void {
    this._error = null;
    this._resolution = null;
  }

  private _settleEach(resolution): void {
    if (this._tasks.length === 0) {
      this._complete();
    } else {
      let task = this._tasks[0];
      let processor = this._processors[0];

      this.emit('beforeTask', task);

      processor.process()
        .then((result) => {
          if (resolution === this._resolution) {
            this._tasks.shift();
            this._processors.shift();

            this._persist()
              .then(() => {
                this.emit('task', task);
                this._settleEach(resolution);
              });
          }
        })
        .catch((e) => {
          if (resolution === this._resolution) {
            this._fail(task, e);
          }
        });
    }
  }

  private _reify(): Promise<void> {
    this._tasks = [];
    this._processors = [];

    if (this._bucket) {
      this._reified = this._bucket.getItem(this._name)
        .then(tasks => {
          if (tasks) {
            this._tasks = tasks;
            this._processors = tasks.map(task => new TaskProcessor(this._target, task));
          }
        });
    } else {
      this._reified = Orbit.Promise.resolve();
    }

    return this._reified;
  }

  private _persist(): Promise<void> {
    this.emit('change');
    if (this._bucket) {
      return this._bucket.setItem(this._name, this._tasks);
    } else {
      return Orbit.Promise.resolve();
    }
  }
}
