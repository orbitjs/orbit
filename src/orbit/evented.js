import Orbit from 'orbit';
import Notifier from './notifier';
import { assert } from './lib/assert';
import { extend } from './lib/objects';

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

 @class Evented
 @namespace Orbit
 @extension
 @constructor
 */
export default {
  /**
   Mixes the `Evented` interface into an object

   @method extend
   @param {Object} object Object to extend
   @returns {Object} Extended object
   */
  extend(object) {
    assert('Evented requires Orbit.Promise be defined', Orbit.Promise);

    if (object._evented === undefined) {
      extend(object, this.interface);
    }

    return object;
  },

  interface: {
    _evented: true,

    on(eventName, callback, _binding) {
      const binding = _binding || this;

      notifierForEvent(this, eventName, true).addListener(callback, binding);
    },

    off(eventName, callback, _binding) {
      const binding = _binding || this;
      const notifier = notifierForEvent(this, eventName);

      if (notifier) {
        if (callback) {
          notifier.removeListener(callback, binding);
        } else {
          removeNotifierForEvent(this, eventName);
        }
      }
    },

    one(eventName, callback, _binding) {
      let callOnce;
      let notifier;
      let binding = _binding || this;

      notifier = notifierForEvent(this, eventName, true);

      callOnce = function() {
        callback.apply(binding, arguments);
        notifier.removeListener(callOnce, binding);
      };

      notifier.addListener(callOnce, binding);
    },

    emit(eventName, ...args) {
      let notifier = notifierForEvent(this, eventName);

      if (notifier) {
        notifier.emit.apply(notifier, args);
      }
    },

    listeners(eventName) {
      let notifier = notifierForEvent(this, eventName);

      return notifier ? notifier.listeners : [];
    },

    settleInSeries(eventName, ...args) {
      const listeners = this.listeners(eventName);

      return listeners.reduce((chain, [callback, binding]) => {
        return chain
          .then(() => callback.apply(binding, args))
          .catch(e => {
            console.error('Orbit ignored error in event listener', eventName);
            console.error(e.stack || e);
          });
      }, Orbit.Promise.resolve());
    },

    fulfillInSeries(eventName, ...args) {
      const listeners = this.listeners(eventName);

      return new Orbit.Promise((resolve, reject) => {
        fulfillEach(listeners, args, resolve, reject);
      });
    }
  }
};

function notifierForEvent(object, eventName, createIfUndefined) {
  if (object._eventedNotifiers === undefined) {
    object._eventedNotifiers = {};
  }
  let notifier = object._eventedNotifiers[eventName];
  if (!notifier && createIfUndefined) {
    notifier = object._eventedNotifiers[eventName] = new Notifier();
  }
  return notifier;
}

function removeNotifierForEvent(object, eventName) {
  if (object._eventedNotifiers && object._eventedNotifiers[eventName]) {
    delete object._eventedNotifiers[eventName];
  }
}

function fulfillEach(listeners, args, resolve, reject) {
  if (listeners.length === 0) {
    resolve();
  } else {
    let listener = listeners.shift();
    let [callback, binding] = listener;
    let response = callback.apply(binding, args);

    if (response) {
      return Orbit.Promise.resolve(response)
        .then(() => fulfillEach(listeners, args, resolve, reject))
        .catch(error => reject(error));
    } else {
      fulfillEach(listeners, args, resolve, reject);
    }
  }
}
