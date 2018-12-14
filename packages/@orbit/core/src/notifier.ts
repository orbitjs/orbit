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
  public listeners: [Function, object][];

  constructor() {
    this.listeners = [];
  }

  /**
   * Add a callback as a listener, which will be triggered when sending
   * notifications.
   */
  addListener(callback: Function, binding: object) {
    binding = binding || this;
    this.listeners.push([callback, binding]);
  }

  /**
   * Remove a listener so that it will no longer receive notifications.
   */
  removeListener(callback: Function, binding: object) {
    let listeners = this.listeners;
    let listener;

    binding = binding || this;
    for (var i = 0, len = listeners.length; i < len; i++) {
      listener = listeners[i];
      if (listener && listener[0] === callback && listener[1] === binding) {
        listeners.splice(i, 1);
        return;
      }
    }
  }

  /**
   * Notify registered listeners.
   */
  emit(...args: any[]) {
    this.listeners.slice(0).forEach((listener) => {
      listener[0].apply(listener[1], args);
    });
  }
}
