/* eslint-disable valid-jsdoc */

/**
 The `Notifier` class can emit messages to an array of subscribed listeners.
 Here's a simple example:

 ```javascript
 var notifier = new Orbit.Notifier();
 notifier.addListener(function(message) {
   console.log("I heard " + message);
 });
 notifier.addListener(function(message) {
   console.log("I also heard " + message);
 });

 notifier.emit('hello'); // logs "I heard hello" and "I also heard hello"
 ```

 Calls to `emit` will send along all of their arguments.

 @class Notifier
 @namespace Orbit
 @constructor
 */
export default class Notifier {
  public listeners: any[]; // TODO - define Listener interface

  constructor() {
    this.listeners = [];
  }

  /**
   Add a callback as a listener, which will be triggered when sending
   notifications.

   @method addListener
   @param {Function} callback Function to call as a notification
   @param {Object} binding Context in which to call `callback`
   */
  addListener(callback, binding) {
    binding = binding || this;
    this.listeners.push([callback, binding]);
  }

  /**
   Remove a listener so that it will no longer receive notifications.

   @method removeListener
   @param {Function} callback Function registered as a callback
   @param {Object} binding Context in which `callback` was registered
   */
  removeListener(callback, binding) {
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
   Notify registered listeners.

   Any responses from listeners will be ignored.

   @method emit
   @param {*} Any number of parameters to be sent to listeners
   */
  emit(...args) {
    this.listeners.slice(0).forEach((listener) => {
      listener[0].apply(listener[1], args);
    });
  }
}
