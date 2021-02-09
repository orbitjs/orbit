import { Notifier, Listener } from './notifier';

const EVENTED = '__evented__';

/**
 * Has a class been decorated as `@evented`?
 */
export function isEvented(obj: unknown): boolean {
  return !!(obj as { [EVENTED]?: boolean })[EVENTED];
}

/**
 * A class decorated as `@evented` should also implement the `Evented`
 * interface.
 *
 * ```ts
 * import { evented, Evented } from '@orbit/core';
 *
 * @evented
 * class Source implements Evented {
 *   // ... Evented implementation
 * }
 * ```
 */
export interface Evented<Event extends string = string> {
  on: (event: Event, listener: Listener) => () => void;
  off: (event: Event, listener?: Listener) => void;
  one: (event: Event, listener: Listener) => () => void;
  emit: (event: Event, ...args: unknown[]) => void;
  listeners: (event: Event) => Listener[];
}

/**
 * Marks a class as evented.
 *
 * An evented class should also implement the `Evented` interface.
 *
 * ```ts
 * import { evented, Evented } from '@orbit/core';
 *
 * @evented
 * class Source implements Evented {
 *   ...
 * }
 * ```
 *
 * Listeners can then register themselves for particular events with `on`:
 *
 * ```ts
 * let source = new Source();
 *
 * function listener1(message: string) {
 *   console.log('listener1 heard ' + message);
 * };
 * function listener2(message: string) {
 *   console.log('listener2 heard ' + message);
 * };
 *
 * source.on('greeting', listener1);
 * source.on('greeting', listener2);
 *
 * evented.emit('greeting', 'hello'); // logs "listener1 heard hello" and
 *                                    //      "listener2 heard hello"
 * ```
 *
 * Listeners can be unregistered from events at any time with `off`:
 *
 * ```ts
 * source.off('greeting', listener2);
 * ```
 */
export function evented(Klass: { prototype: any }): void {
  let proto = Klass.prototype;

  if (isEvented(proto)) {
    return;
  }

  proto[EVENTED] = true;

  proto.on = function (eventName: string, listener: Listener): () => void {
    return notifierForEvent(this, eventName, true).addListener(listener);
  };

  proto.off = function (eventName: string, listener: Listener) {
    const notifier = notifierForEvent(this, eventName);

    if (notifier) {
      if (listener) {
        notifier.removeListener(listener);
      } else {
        removeNotifierForEvent(this, eventName);
      }
    }
  };

  proto.one = function (eventName: string, listener: Listener): () => void {
    const notifier = notifierForEvent(this, eventName, true);

    const callOnce = function () {
      listener(...arguments);
      notifier.removeListener(callOnce);
    };

    return notifier.addListener(callOnce);
  };

  proto.emit = function (eventName: string, ...args: unknown[]) {
    let notifier = notifierForEvent(this, eventName);

    if (notifier) {
      notifier.emit.apply(notifier, args);
    }
  };

  proto.listeners = function (eventName: string) {
    let notifier = notifierForEvent(this, eventName);
    return notifier ? notifier.listeners : [];
  };
}

/**
 * Settle any promises returned by event listeners in series.
 *
 * Returns an array of results (or `undefined`) returned by listeners.
 *
 * If any errors are encountered during processing, they will be caught and
 * returned with other results. Errors will not interrupt further processing.
 */
export async function settleInSeries(
  obj: Evented,
  eventName: string,
  ...args: unknown[]
): Promise<unknown[]> {
  const listeners = obj.listeners(eventName);
  const results: unknown[] = [];

  for (let listener of listeners) {
    try {
      results.push(await listener(...args));
    } catch (e) {
      results.push(e);
    }
  }
  return results;
}

/**
 * Fulfills any promises returned by event listeners in series.
 *
 * Returns an array of results (or `undefined`) returned by listeners.
 *
 * On error, processing will stop and the returned promise will be rejected with
 * the error that was encountered.
 */
export async function fulfillInSeries(
  obj: Evented,
  eventName: string,
  ...args: unknown[]
): Promise<unknown[]> {
  const listeners = obj.listeners(eventName);
  const results: unknown[] = [];

  for (let listener of listeners) {
    results.push(await listener(...args));
  }

  return results;
}

/**
 * Fulfills any promises returned by event listeners in parallel, using
 * `Promise.all`.
 *
 * Returns an array of results (or `undefined`) returned by listeners.
 *
 * On error, processing will stop and the returned promise will be rejected with
 * the error that was encountered.
 */
export async function fulfillAll(
  obj: Evented,
  eventName: string,
  ...args: unknown[]
): Promise<unknown[]> {
  const listeners = obj.listeners(eventName);
  const promises: Promise<unknown>[] = [];

  for (let listener of listeners) {
    promises.push(listener(...args));
  }

  return Promise.all(promises);
}

function notifierForEvent(
  object: any,
  eventName: string,
  createIfUndefined = false
) {
  if (object._eventedNotifiers === undefined) {
    object._eventedNotifiers = {};
  }
  let notifier = object._eventedNotifiers[eventName];
  if (!notifier && createIfUndefined) {
    notifier = object._eventedNotifiers[eventName] = new Notifier();
  }
  return notifier;
}

function removeNotifierForEvent(object: any, eventName: string) {
  if (object._eventedNotifiers && object._eventedNotifiers[eventName]) {
    delete object._eventedNotifiers[eventName];
  }
}
