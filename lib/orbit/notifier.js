import { Class } from './lib/objects';

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

 Notifiers can also poll listeners with an event and return their responses:

 ```javascript
 var dailyQuestion = new Orbit.Notifier();
 dailyQuestion.addListener(function(question) {
   if (question === 'favorite food?') return 'beer';
 });
 dailyQuestion.addListener(function(question) {
   if (question === 'favorite food?') return 'wasabi almonds';
 });
 dailyQuestion.addListener(function(question) {
   // this listener doesn't return anything, and therefore won't participate
   // in the poll
 });

 dailyQuestion.poll('favorite food?'); // returns ['beer', 'wasabi almonds']
 ```

 Calls to `emit` and `poll` will send along all of their arguments.

 @class Notifier
 @namespace Orbit
 @constructor
 */
var Notifier = Class.extend({
  init: function() {
    this.listeners = [];
  },

  /**
   Add a callback as a listener, which will be triggered when sending
   notifications.

   @method addListener
   @param {Function} callback Function to call as a notification
   @param {Object} binding Context in which to call `callback`
   */
  addListener: function(callback, binding) {
    binding = binding || this;
    this.listeners.push([callback, binding]);
  },

  /**
   Remove a listener so that it will no longer receive notifications.

   @method removeListener
   @param {Function} callback Function registered as a callback
   @param {Object} binding Context in which `callback` was registered
   */
  removeListener: function(callback, binding) {
    var listeners = this.listeners,
        listener;

    binding = binding || this;
    for (var i = 0, len = listeners.length; i < len; i++) {
      listener = listeners[i];
      if (listener && listener[0] === callback && listener[1] === binding) {
        listeners.splice(i, 1);
        return;
      }
    }
  },

  /**
   Notify registered listeners.

   Any responses from listeners will be ignored.

   @method emit
   @param {*} Any number of parameters to be sent to listeners
   */
  emit: function() {
    var args = arguments;
    this.listeners.slice(0).forEach(function(listener) {
      listener[0].apply(listener[1], args);
    });
  },

  /**
   Poll registered listeners.

   Any responses from listeners will be returned in an array.

   @method poll
   @param {*} Any number of parameters to be sent to listeners
   @returns {Array} Array of responses
   */
  poll: function() {
    var args = arguments,
        allResponses = [],
        response;

    this.listeners.slice(0).forEach(function(listener) {
      response = listener[0].apply(listener[1], args);
      if (response !== undefined) { allResponses.push(response); }
    });

    return allResponses;
  }
});

export default Notifier;
