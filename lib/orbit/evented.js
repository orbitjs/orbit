import Orbit from './main';
import Notifier from './notifier';
import { assert } from './lib/assert';
import { extend } from './lib/objects';

var notifierForEvent = function(object, eventName, createIfUndefined) {
  var notifier = object._eventedNotifiers[eventName];
  if (!notifier && createIfUndefined) {
    notifier = object._eventedNotifiers[eventName] = new Notifier();
  }
  return notifier;
};

var removeNotifierForEvent = function(object, eventName) {
  delete object._eventedNotifiers[eventName];
};

/**
 The `Evented` interface uses notifiers to add events to an object. Like
 notifiers, events will send along all of their arguments to subscribed
 listeners.

 The `Evented` interface can extend an object or prototype as follows:

 ```javascript
 var source = {};
 Orbit.Evented.extend(source);
 ```

 Listeners can then register themselves for particular events with `on`:

 ```javascript
 var listener1 = function(message) {
       console.log('listener1 heard ' + message);
     },
     listener2 = function(message) {
       console.log('listener2 heard ' + message);
     };

 source.on('greeting', listener1);
 source.on('greeting', listener2);

 evented.emit('greeting', 'hello'); // logs "listener1 heard hello" and
                                    //      "listener2 heard hello"
 ```

 Listeners can be unregistered from events at any time with `off`:

 ```javascript
 source.off('greeting', listener2);
 ```

 A listener can register itself for multiple events at once:

 ```javascript
 source.on('greeting salutation', listener2);
 ```

 And multiple events can be triggered sequentially at once,
 assuming that you want to pass them all the same arguments:

 ```javascript
 source.emit('greeting salutation', 'hello', 'bonjour', 'guten tag');
 ```

 Last but not least, listeners can be polled
 (note that spaces can't be used in event names):

 ```javascript
 source.on('question', function(question) {
   if (question === 'favorite food?') return 'beer';
 });

 source.on('question', function(question) {
   if (question === 'favorite food?') return 'wasabi almonds';
 });

 source.on('question', function(question) {
   // this listener doesn't return anything, and therefore won't participate
   // in the poll
 });

 source.poll('question', 'favorite food?'); // returns ['beer', 'wasabi almonds']
 ```

 @class Evented
 @namespace Orbit
 @extension
 @constructor
 */
var Evented = {
  /**
   Mixes the `Evented` interface into an object

   @method extend
   @param {Object} object Object to extend
   @returns {Object} Extended object
   */
  extend: function(object) {
    assert('Evented requires Orbit.Promise be defined', Orbit.Promise);

    if (object._evented === undefined) {
      extend(object, this.interface);
      object._eventedNotifiers = {};
    }
    return object;
  },

  interface: {
    _evented: true,

    on: function(eventNames, callback, binding) {
      binding = binding || this;

      eventNames.split(/\s+/).forEach(function(eventName) {
        notifierForEvent(this, eventName, true).addListener(callback, binding);
      }, this);
    },

    off: function(eventNames, callback, binding) {
      var notifier;

      binding = binding || this;

      eventNames.split(/\s+/).forEach(function(eventName) {
        notifier = notifierForEvent(this, eventName);
        if (notifier) {
          if (callback) {
            notifier.removeListener(callback, binding);
          } else {
            removeNotifierForEvent(this, eventName);
          }
        }
      }, this);
    },

    one: function(eventName, callback, binding) {
      var callOnce,
          notifier;

      binding = binding || this;

      notifier = notifierForEvent(this, eventName, true);

      callOnce = function() {
        callback.apply(binding, arguments);
        notifier.removeListener(callOnce, binding);
      };

      notifier.addListener(callOnce, binding);
    },

    emit: function(eventNames) {
      var args = Array.prototype.slice.call(arguments, 1),
          notifier;

      eventNames.split(/\s+/).forEach(function(eventName) {
        notifier = notifierForEvent(this, eventName);
        if (notifier) {
          notifier.emit.apply(notifier, args);
        }
      }, this);
    },

    poll: function(eventNames) {
      var args = Array.prototype.slice.call(arguments, 1),
          notifier,
          responses = [];

      eventNames.split(/\s+/).forEach(function(eventName) {
        notifier = notifierForEvent(this, eventName);
        if (notifier) {
          responses = responses.concat(notifier.poll.apply(notifier, args));
        }
      }, this);

      return responses;
    },

    listeners: function(eventNames) {
      var notifier,
          listeners = [];

      eventNames.split(/\s+/).forEach(function(eventName) {
        notifier = notifierForEvent(this, eventName);
        if (notifier) {
          listeners = listeners.concat(notifier.listeners);
        }
      }, this);

      if (eventNames === 'error' && listeners.length === 0) {
        listeners = [[function(error, eventNames, args) {
          console.error('Error during Orbit event: ' + eventNames);
          console.error('Arguments: ', args);
          console.error(error.stack || e);
        }]];
      }

      return listeners;
    },

    resolve: function(eventNames) {
      var _this = this,
          args = Array.prototype.slice.call(arguments, 1),
          // Resolve is ok with errors but we may want to report errors if all
          // resolve listeners failed.
          errors = [];
      return this.listeners(eventNames)
        .reduce(function(carry, listener) {
          return carry
            .then(function(pastSuccess) {
              if (pastSuccess) { return pastSuccess; }
              return listener[0].apply(listener[1], args);
            })
            .catch(function(error) {
              errors.push(['error', error, eventNames, args]);
            });
        }, Orbit.Promise.resolve())
        .then(function(success) {
          if (success) { return success; }

          // Allow for handling or reporting of all errors.
          errors.forEach(function(errorArgs) {
            _this.settle.apply(_this, errorArgs);
          });

          if (errors.length) {
            throw errors[0][1];
          } else {
            throw new Error('Coult not resolve ' + eventNames);
          }
        });
    },

    settle: function(eventNames) {
      var _this = this,
          args = Array.prototype.slice.call(arguments, 1);
      return this.listeners(eventNames).reduce(function(carry, listener) {
        return carry
          .then(function() {
            return listener[0].apply(listener[1], args);
          })
          .catch(function(error) {
            return _this.settle('error', error, eventNames, args);
          });
      }, Orbit.Promise.resolve());
    }
  }
};

export default Evented;