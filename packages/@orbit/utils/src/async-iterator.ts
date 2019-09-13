import { Deferred } from './deferred';

export class Subject<T> {
  public iterator: AsyncIterableIterator<T>;

  private doneValue: IteratorResult<T> = {
    done: true,
    value: undefined
  };

  private queue: IteratorResult<T>[] = [];
  private deferreds: Deferred<IteratorResult<T>>[] = [];
  private done: boolean = false;
  private noMoreResults: boolean = false;
  private backPressureDeferred = new Deferred<void>();
  private finallyCallbacks: (() => void)[] = [];
  private error?: any = undefined;

  constructor() {
    const self = this;

    this.iterator = {
      throw(error?: any) {
        self.done = true;
        self.finallyCallbacks.map(cb => cb());
        // fail any waiting deferreds
        for (const deferred of self.deferreds) {
          deferred.reject(error);
        }
        return Promise.reject(error);
      },
      return() {
        self.done = true;
        self.finallyCallbacks.map(cb => cb());
        // fail any waiting deferreds
        for (const deferred of self.deferreds) {
          deferred.resolve(self.doneValue);
        }
        return Promise.resolve(self.doneValue);
      },
      next() {
        if (self.error) {
          return Promise.reject(self.error);
        }
        const queuedItem = self.queue.shift();
        if (self.queue.length === 0) {
          self.backPressureDeferred.resolve();
          self.backPressureDeferred = new Deferred<void>();
        }
        if (queuedItem !== undefined) {
          return Promise.resolve(queuedItem);
        } else {
          if (self.noMoreResults && !self.done) {
            self.done = true;
            self.finallyCallbacks.map(cb => cb());
          }
          if (self.done) {
            return Promise.resolve(self.doneValue);
          }
          const deferred = new Deferred<IteratorResult<T>>();
          self.deferreds.push(deferred);
          return deferred.promise;
        }
      },
      [Symbol.asyncIterator]() {
        return this;
      }
    };
  }

  public finally(callback: () => void) {
    this.finallyCallbacks.push(callback);
  }

  public onCompleted(): Promise<void> {
    return this.callback(this.doneValue);
  }

  public onNext(value: T): Promise<void> {
    return this.callback({ done: false, value });
  }

  public onError(error: any) {
    this.error = error;
    for (const queuedDeferred of this.deferreds) {
      queuedDeferred.reject(error);
    }
    this.noMoreResults = true;
  }

  public isDone() {
    return this.done;
  }

  public callback(result: IteratorResult<T>): Promise<void> {
    if (!(this && this instanceof Subject)) {
      const errorMessage = 'This must be a Subject. Have you bound this?';
      throw new Error(errorMessage);
    }
    if (result.done) {
      for (const queuedDeferred of this.deferreds) {
        queuedDeferred.resolve(result);
      }
      this.noMoreResults = true;
      return Promise.resolve();
    }
    const deferred = this.deferreds.pop();
    if (deferred !== undefined) {
      deferred.resolve(result);
      return Promise.resolve();
    } else {
      this.queue.push(result);
      return this.backPressureDeferred.promise;
    }
  }
}

export function filter<T>(
  predicate: (t: T) => Promise<boolean> | boolean
): (source: AsyncIterable<T>) => AsyncIterableIterator<T> {
  return async function* inner(source: AsyncIterable<T>) {
    for await (const item of source) {
      if (predicate(item)) {
        yield await item;
      }
    }
  };
}

export function map<TFrom, TTo>(
  mapper: (t: TFrom, index: number) => Promise<TTo> | TTo
): (source: AsyncIterable<TFrom>) => AsyncIterableIterator<TTo> {
  return async function* inner(source: AsyncIterable<TFrom>) {
    let index = 0;
    for await (const item of source) {
      yield await mapper(item, index++);
    }
  };
}

export function pipe<T>(
  ...funcs: ((iterable: AsyncIterable<any>) => any)[]
): (source: AsyncIterable<any>) => AsyncIterableIterator<T> {
  return function inner(source: AsyncIterable<any>) {
    let current = source;
    for (const func of funcs) {
      current = func(current);
    }
    return current as AsyncIterableIterator<T>;
  };
}
