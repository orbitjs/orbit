import Notifier, { Listener } from './notifier';
import { deprecate } from '@orbit/utils';

export const EVENTED = '__evented__';

/**
 * Has a class been decorated as `@evented`?
 */
export function isEvented(obj: any): boolean {
  return !!obj[EVENTED];
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
export interface Evented {
  on: (event: string, listener: Listener) => void;
  off: (event: string, listener?: Listener) => void;
  one: (event: string, listener: Listener) => void;
  emit: (event: string, ...args: any[]) => void;
  listeners: (event: string) => Listener[];
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
export default function evented(Klass: any): void {
  let proto = Klass.prototype;

  if (isEvented(proto)) {
    return;
  }

  proto[EVENTED] = true;

  proto.on = function(eventName: string, listener: Listener) {
    if (arguments.length > 2) {
      deprecate('`binding` argument is no longer supported when configuring `Evented` listeners. Please pre-bind listeners before calling `on`.');
    }

    notifierForEvent(this, eventName, true).addListener(listener);
  };

  proto.off = function(eventName: string, listener: Listener) {
    if (arguments.length > 2) {
      deprecate('`binding` argument is no longer supported when configuring `Evented` listeners. Please pre-bind listeners before calling `off`.');
    }

    const notifier = notifierForEvent(this, eventName);

    if (notifier) {
      if (listener) {
        notifier.removeListener(listener);
      } else {
        removeNotifierForEvent(this, eventName);
      }
    }
  };

  proto.one = function(eventName: string, listener: Listener) {
    if (arguments.length > 2) {
      deprecate('`binding` argument is no longer supported when configuring `Evented` listeners. Please pre-bind listeners before calling `off`.');
    }

    const notifier = notifierForEvent(this, eventName, true);

    const callOnce = function() {
      listener(...arguments);
      notifier.removeListener(callOnce);
    };

    notifier.addListener(callOnce);
  };

  proto.emit = function(eventName: string, ...args: any[]) {
    let notifier = notifierForEvent(this, eventName);

    if (notifier) {
      notifier.emit.apply(notifier, args);
    }
  };

  proto.listeners = function(eventName: string) {
    let notifier = notifierForEvent(this, eventName);
    return notifier ? notifier.listeners : [];
  };
}

/**
 * Settle any promises returned by event listeners in series.
 *
 * If any errors are encountered during processing, they will be ignored.
 */
export function settleInSeries(obj: Evented, eventName: string, ...args: any[]): Promise<void> {
  const listeners = obj.listeners(eventName);

  return listeners.reduce((chain, listener) => {
    return chain
      .then(() => listener(...args))
      .catch(() => {});
  }, Promise.resolve());
}

/**
 * Fulfill any promises returned by event listeners in series.
 *
 * Processing will stop if an error is encountered and the returned promise will
 * be rejected.
 */
export function fulfillInSeries(obj: Evented, eventName: string, ...args: any[]): Promise<void> {
  const listeners = obj.listeners(eventName);

  return new Promise((resolve, reject) => {
    fulfillEach(listeners, args, resolve, reject);
  });
}

function notifierForEvent(object: any, eventName: string, createIfUndefined = false) {
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

function fulfillEach(listeners: Listener[], args: any[], resolve: Function, reject: Function): Promise<any> {
  if (listeners.length === 0) {
    resolve();
  } else {
    let listener;
    [listener, ...listeners] = listeners;
    let response = listener(...args);

    if (response) {
      return Promise.resolve(response)
        .then(() => fulfillEach(listeners, args, resolve, reject))
        .catch((error: Error) => reject(error));
    } else {
      fulfillEach(listeners, args, resolve, reject);
    }
  }
}
