import Orbit from './main';
import { Task, Performer } from './task';
import TaskProcessor from './task-processor';
import { Bucket } from './bucket';
import evented, { Evented, settleInSeries } from './evented';
import { Listener } from './notifier';

const { assert } = Orbit;

/**
 * Settings for a `TaskQueue`.
 */
export interface TaskQueueSettings {
  /**
   * Name used for tracking and debugging a task queue.
   */
  name?: string;

  /**
   * A bucket in which to persist queue state.
   */
  bucket?: Bucket;

  /**
   * A flag indicating whether tasks should be processed as soon as they are
   * pushed into a queue. Set to `false` to override the default `true`
   * behavior.
   */
  autoProcess?: boolean;
}

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
  on: (event: string, listener: Listener) => void;
  off: (event: string, listener?: Listener) => void;
  one: (event: string, listener: Listener) => void;
  emit: (event: string, ...args: any[]) => void;
  listeners: (event: string) => Listener[];

  /**
   * Creates an instance of `TaskQueue`.
   */
  constructor(target: Performer, settings: TaskQueueSettings = {}) {
    this._performer = target;
    this._name = settings.name;
    this._bucket = settings.bucket;
    this.autoProcess =
      settings.autoProcess === undefined ? true : settings.autoProcess;

    if (this._bucket) {
      assert('TaskQueue requires a name if it has a bucket', !!this._name);
    }

    this._reify().then(() => {
      if (this.length > 0 && this.autoProcess) {
        this.process();
      }
    });
  }

  /**
   * Name used for tracking / debugging this queue.
   */
  get name(): string {
    return this._name;
  }

  /**
   * The object which will `perform` the tasks in this queue.
   */
  get performer(): Performer {
    return this._performer;
  }

  /**
   * A bucket used to persist the state of this queue.
   */
  get bucket(): Bucket {
    return this._bucket;
  }

  /**
   * The number of tasks in the queue.
   */
  get length(): number {
    return this._tasks ? this._tasks.length : 0;
  }

  /**
   * The tasks in the queue.
   */
  get entries(): Task[] {
    return this._tasks;
  }

  /**
   * The current task being processed (if actively processing), or the next
   * task to be processed (if not actively processing).
   */
  get current(): Task {
    return this._tasks && this._tasks[0];
  }

  /**
   * The processor wrapper that is processing the current task (or next task,
   * if none are being processed).
   */
  get currentProcessor(): TaskProcessor {
    return this._processors && this._processors[0];
  }

  /**
   * If an error occurs while processing a task, processing will be halted, the
   * `fail` event will be emitted, and this property will reflect the error
   * encountered.
   */
  get error(): Error {
    return this._error;
  }

  /**
   * Is the queue empty?
   */
  get empty(): boolean {
    return this.length === 0;
  }

  /**
   * Is the queue actively processing a task?
   */
  get processing(): boolean {
    const processor = this.currentProcessor;

    return processor !== undefined && processor.started && !processor.settled;
  }

  /**
   * Resolves when the queue has been fully reified from its associated bucket,
   * if applicable.
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
   */
  push(task: Task): Promise<void> {
    let processor = new TaskProcessor(this._performer, task);

    return this._reified
      .then(() => {
        this._tasks.push(task);
        this._processors.push(processor);
        return this._persist();
      })
      .then(() => this._settle(processor));
  }

  /**
   * Cancels and re-tries processing the current task.
   *
   * Returns a promise that resolves when the pushed task has been processed.
   */
  retry(): Promise<void> {
    let processor: TaskProcessor;

    return this._reified
      .then(() => {
        this._cancel();
        processor = this.currentProcessor;
        processor.reset();
        return this._persist();
      })
      .then(() => this._settle(processor, true));
  }

  /**
   * Cancels and discards the current task.
   *
   * If `autoProcess` is enabled, this will automatically trigger processing of
   * the queue.
   */
  skip(e?: Error): Promise<void> {
    return this._reified
      .then(() => {
        this._cancel();
        this._tasks.shift();
        let processor = this._processors.shift();
        if (processor !== undefined && !processor.settled) {
          processor.reject(
            e || new Error('Processing cancelled via `TaskQueue#skip`')
          );
        }
        return this._persist();
      })
      .then(() => this._settle());
  }

  /**
   * Cancels the current task and completely clears the queue.
   */
  clear(e?: Error): Promise<void> {
    return this._reified
      .then(() => {
        this._cancel();
        this._tasks = [];
        for (let processor of this._processors) {
          if (!processor.settled) {
            processor.reject(
              e || new Error('Processing cancelled via `TaskQueue#clear`')
            );
          }
        }
        this._processors = [];
        return this._persist();
      })
      .then(() => this._settle(null, true));
  }

  /**
   * Cancels the current task and removes it, but does not continue processing.
   *
   * Returns the canceled and removed task.
   */
  shift(e?: Error): Promise<Task> {
    let task: Task;

    return this._reified
      .then(() => {
        this._cancel();
        task = this._tasks.shift();
        let processor = this._processors.shift();
        if (processor !== undefined && !processor.settled) {
          processor.reject(
            e || new Error('Processing cancelled via `TaskQueue#shift`')
          );
        }
        return this._persist();
      })
      .then(() => task);
  }

  /**
   * Cancels processing the current task and inserts a new task at the beginning
   * of the queue. This new task will be processed next.
   *
   * Returns a promise that resolves when the new task has been processed.
   */
  unshift(task: Task): Promise<void> {
    let processor = new TaskProcessor(this._performer, task);

    return this._reified
      .then(() => {
        this._cancel();
        this._tasks.unshift(task);
        this._processors.unshift(processor);
        return this._persist();
      })
      .then(() => this._settle(processor));
  }

  /**
   * Processes all the tasks in the queue. Resolves when the queue is empty.
   */
  process(): Promise<any> {
    return this._reified.then(() => {
      let resolution = this._resolution;

      if (!resolution) {
        if (this._tasks.length === 0) {
          resolution = this._complete();
        } else {
          this._error = null;
          this._resolution = resolution = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
          });
          this._settleEach(resolution);
        }
      }

      return resolution;
    });
  }

  private _settle(
    processor?: TaskProcessor,
    alwaysProcess?: boolean
  ): Promise<void> {
    if (this.autoProcess || alwaysProcess) {
      let settle = processor ? () => processor.settle() : () => {};
      return this.process().then(settle, settle);
    } else if (processor) {
      return processor.settle();
    } else {
      return Promise.resolve();
    }
  }

  private _complete(): Promise<void> {
    if (this._resolve) {
      this._resolve();
    }
    this._resolve = null;
    this._reject = null;
    this._error = null;
    this._resolution = null;
    return settleInSeries(this, 'complete');
  }

  private _fail(task: Task, e: Error): Promise<void> {
    if (this._reject) {
      this._reject(e);
    }
    this._resolve = null;
    this._reject = null;
    this._error = e;
    this._resolution = null;
    return settleInSeries(this, 'fail', task, e);
  }

  private _cancel(): void {
    this._error = null;
    this._resolution = null;
  }

  private _settleEach(resolution: any): Promise<void> {
    if (this._tasks.length === 0) {
      return this._complete();
    } else {
      let task = this._tasks[0];
      let processor = this._processors[0];

      return settleInSeries(this, 'beforeTask', task)
        .then(() => processor.process())
        .then(() => {
          if (resolution === this._resolution) {
            this._tasks.shift();
            this._processors.shift();

            return this._persist()
              .then(() => settleInSeries(this, 'task', task))
              .then(() => this._settleEach(resolution));
          }
        })
        .catch(e => {
          if (resolution === this._resolution) {
            return this._fail(task, e);
          }
        });
    }
  }

  private _reify(): Promise<void> {
    this._tasks = [];
    this._processors = [];

    if (this._bucket) {
      this._reified = this._bucket.getItem(this._name).then((tasks: Task[]) => {
        if (tasks) {
          this._tasks = tasks;
          this._processors = tasks.map(
            task => new TaskProcessor(this._performer, task)
          );
        }
      });
    } else {
      this._reified = Promise.resolve();
    }

    return this._reified;
  }

  private _persist(): Promise<void> {
    this.emit('change');
    if (this._bucket) {
      return this._bucket.setItem(this._name, this._tasks);
    } else {
      return Promise.resolve();
    }
  }
}
