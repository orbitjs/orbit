import Orbit from './main';
import { Task, Performer } from './task';
import TaskProcessor from './task-processor';
import { Bucket } from './bucket';
import evented, { Evented } from './evented';
import { assert } from '@orbit/utils';

/**
 * Settings for a `TaskQueue`.
 *
 * @export
 * @interface TaskQueueSettings
 */
export interface TaskQueueSettings {
  /**
   * Name used for tracking and debugging a task queue.
   *
   * @type {string}
   * @memberOf TaskQueueSettings
   */
  name?: string;

  /**
   * A bucket in which to persist queue state.
   *
   * @type {Bucket}
   * @memberOf TaskQueueSettings
   */
  bucket?: Bucket;

  /**
   * A flag indicating whether tasks should be processed as soon as they are
   * pushed into a queue. Set to `false` to override the default `true`
   * behavior.
   *
   * @type {boolean}
   * @memberOf TaskQueueSettings
   */
  autoProcess?: boolean;
}

export type TASK_QUEUE_EVENTS = 'complete' | 'fail' | 'beforeTask' | 'task' | 'change';

/**
 * `TaskQueue` is a FIFO queue of asynchronous tasks that should be
 * performed sequentially.
 *
 * Tasks are added to the queue with `push`. Each task will be processed by
 * calling its `process` method.
 *
 * By default, task queues will be processed automatically, as soon as tasks
 * are pushed to them. This can be overridden by setting the `autoProcess`
 * setting to `false` and calling `process` when you'd like to start
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
  private _performer: Performer;
  private _bucket: Bucket;
  private _tasks: Task[];
  private _processors: TaskProcessor[];
  private _error: Error;
  private _resolution: Promise<void>;
  private _resolve: any;
  private _reject: any;
  private _reified: Promise<any>;

  // Evented interface stubs
  on: (event: TASK_QUEUE_EVENTS, callback: Function, binding?: object) => void;
  off: (event: TASK_QUEUE_EVENTS, callback: Function, binding?: object) => void;
  one: (event: TASK_QUEUE_EVENTS, callback: Function, binding?: object) => void;
  emit: (event: TASK_QUEUE_EVENTS, ...args) => void;
  listeners: (event: TASK_QUEUE_EVENTS) => any[];

  /**
   * Creates an instance of `TaskQueue`.
   *
   * @param {Performer} target
   * @param {TaskQueueOptions} [options={}]
   *
   * @memberOf TaskQueue
   */
  constructor(target: Performer, settings: TaskQueueSettings = {}) {
    assert('TaskQueue requires Orbit.Promise to be defined', Orbit.Promise);

    this._performer = target;
    this._name = settings.name;
    this._bucket = settings.bucket;
    this.autoProcess = settings.autoProcess === undefined ? true : settings.autoProcess;

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

  /**
   * Name used for tracking / debugging this queue.
   *
   * @readonly
   * @type {string}
   * @memberOf TaskQueue
   */
  get name(): string {
    return this._name;
  }

  /**
   * The object which will `perform` the tasks in this queue.
   *
   * @readonly
   * @type {Performer}
   * @memberOf TaskQueue
   */
  get performer(): Performer {
    return this._performer;
  }

  /**
   * A bucket used to persist the state of this queue.
   *
   * @readonly
   * @type {Bucket}
   * @memberOf TaskQueue
   */
  get bucket(): Bucket {
    return this._bucket;
  }

  /**
   * The number of tasks in the queue.
   *
   * @readonly
   * @type {number}
   * @memberOf TaskQueue
   */
  get length(): number {
    return this._tasks ? this._tasks.length : 0;
  }

  /**
   * The tasks in the queue.
   *
   * @readonly
   * @type {Task[]}
   * @memberOf TaskQueue
   */
  get entries(): Task[] {
    return this._tasks;
  }

  /**
   * The current task being processed (if actively processing), or the next
   * task to be processed (if not actively processing).
   *
   * @readonly
   * @type {Task}
   * @memberOf TaskQueue
   */
  get current(): Task {
    return this._tasks && this._tasks[0];
  }

  /**
   * The processor wrapper that is processing the current task (or next task,
   * if none are being processed).
   *
   * @readonly
   * @type {TaskProcessor}
   * @memberOf TaskQueue
   */
  get currentProcessor(): TaskProcessor {
    return this._processors && this._processors[0];
  }

  /**
   * If an error occurs while processing a task, processing will be halted, the
   * `fail` event will be emitted, and this property will reflect the error
   * encountered.
   *
   * @readonly
   * @type {Error}
   * @memberOf TaskQueue
   */
  get error(): Error {
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

  /**
   * Is the queue actively processing a task?
   *
   * @readonly
   * @type {boolean}
   * @memberOf TaskQueue
   */
  get processing(): boolean {
    const processor = this.currentProcessor;

    return processor !== undefined &&
           processor.started &&
           !processor.settled;
  }

  /**
   * Resolves when the queue has been fully reified from its associated bucket,
   * if applicable.
   *
   * @readonly
   * @type {Promise<void>}
   * @memberOf TaskQueue
   */
  get reified(): Promise<void> {
    return this._reified;
  }

  /**
   * Push a new task onto the end of the queue.
   *
   * If `autoProcess` is enabled, this will automatically trigger processing of
   * the queue.
   *
   * Returns a promise that resolves when the pushed task has been processed.
   *
   * @param {Task} task
   * @returns {Promise<void>}
   *
   * @memberOf TaskQueue
   */
  push(task: Task): Promise<void> {
    let processor = new TaskProcessor(this._performer, task);
    return this._reified
      .then(() => {
        this._tasks.push(task);
        this._processors.push(processor);
        return this._persist();
      })
      .then(() => {
        if (this.autoProcess) {
          this.process();
        }
        return processor.settle();
      });
  }

  /**
   * Cancels and re-tries processing the current task.
   *
   * @returns {Promise<void>}
   *
   * @memberOf TaskQueue
   */
  retry(): Promise<void> {
    let processor;

    return this._reified
      .then(() => {
        this._cancel();
        processor = this.currentProcessor;
        processor.reset();
        return this._persist();
      })
      .then(() => {
        this.process();
        return processor.settle();
      });
  }

  /**
   * Cancels and discards the current task.
   *
   * If `autoProcess` is enabled, this will automatically trigger processing of
   * the queue.
   *
   * @returns {Promise<void>}
   *
   * @memberOf TaskQueue
   */
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

  /**
   * Cancels the current task and completely clears the queue.
   *
   * @returns {Promise<void>}
   *
   * @memberOf TaskQueue
   */
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

  /**
   * Cancels the current task and removes it, but does not continue processing.
   *
   * Returns the canceled and removed task.
   *
   * @returns {Promise<Task>}
   *
   * @memberOf TaskQueue
   */
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

  /**
   * Cancels processing the current task and inserts a new task at the beginning
   * of the queue. This new task will be processed next.
   *
   * @param {Task} task
   * @returns {Promise<void>}
   *
   * @memberOf TaskQueue
   */
  unshift(task: Task): Promise<void> {
    return this._reified
      .then(() => {
        this._cancel();
        this._tasks.unshift(task);
        this._processors.unshift(new TaskProcessor(this._performer, task));
        return this._persist();
      });
  }

  /**
   * Processes all the tasks in the queue. Resolves when the queue is empty.
   *
   * @returns {Promise<any>}
   *
   * @memberOf TaskQueue
   */
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
            this._processors = tasks.map(task => new TaskProcessor(this._performer, task));
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
