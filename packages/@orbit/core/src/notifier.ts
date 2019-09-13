import Orbit from './main';

const { deprecate } = Orbit;

export type Listener = (...args: any[]) => any;

/**
 *  The `Notifier` class can emit messages to an array of subscribed listeners.
 * Here's a simple example:
 *
 * ```ts
 * import { Notifier } from '@orbit/core';
 *
 * let notifier = new Notifier();
 * notifier.addListener((message: string) => {
 *   console.log("I heard " + message);
 * });
 * notifier.addListener((message: string) => {
 *   console.log("I also heard " + message);
 * });
 *
 * notifier.emit('hello'); // logs "I heard hello" and "I also heard hello"
 * ```
 *
 * Calls to `emit` will send along all of their arguments.
 */
export default class Notifier {
  public listeners: Listener[];

  constructor() {
    this.listeners = [];
  }

  /**
   * Add a callback as a listener, which will be triggered when sending
   * notifications.
   */
  addListener(listener: Listener): () => void {
    if (arguments.length > 1) {
      deprecate(
        '`binding` argument is no longer supported for individual `Notifier` listeners. Please pre-bind listeners before calling `addListener`.'
      );
    }

    this.listeners.push(listener);

    return () => this.removeListener(listener);
  }

  /**
   * Remove a listener so that it will no longer receive notifications.
   */
  removeListener(listener: Listener) {
    if (arguments.length > 1) {
      deprecate(
        '`binding` argument is no longer supported for individual `Notifier` listeners. Please pre-bind listeners before calling `removeListener`.'
      );
    }

    const listeners = this.listeners;

    for (let i = 0, len = listeners.length; i < len; i++) {
      if (listeners[i] === listener) {
        listeners.splice(i, 1);
        return;
      }
    }
  }

  /**
   * Notify registered listeners.
   */
  emit(...args: any[]) {
    this.listeners.slice(0).forEach(listener => listener(...args));
  }
}
