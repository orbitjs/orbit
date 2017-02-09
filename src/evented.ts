import Orbit from './main';
import Notifier from './notifier';
import { assert } from './lib/assert';
import { extend } from './lib/objects';

/**
 The `Evented` interface uses notifiers to add events to an object. Like
 notifiers, events will send along all of their arguments to subscribed
 listeners.

 The `Evented` interface can extend an object or prototype as follows:

 ```javascript
 import evented from 'orbit-core/evented';
 
 @evented
 class Source {}
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
 @extension
 @constructor
 */

export const EVENTED = '__evented__';

export function isEvented(obj: any) {
  return !!obj[EVENTED];
}

export interface Evented {
  on: (event: string, callback: () => void, binding?: any) => void;
  off: (event: string, callback: () => void, binding?: any) => void;
  one: (event: string, callback: () => void, binding?: any) => void;
  emit: (event: string, ...args) => void;
  listeners: (event: string) => any[];
}

export default function evented(Klass: any) {
  let proto = Klass.prototype;

  if (isEvented(proto)) {
    return;
  }

  proto[EVENTED] = true;

  proto.on = function(eventName, callback, _binding) {
    const binding = _binding || this;

    notifierForEvent(this, eventName, true).addListener(callback, binding);
  };

  proto.off = function(eventName, callback, _binding) {
    const binding = _binding || this;
    const notifier = notifierForEvent(this, eventName);

    if (notifier) {
      if (callback) {
        notifier.removeListener(callback, binding);
      } else {
        removeNotifierForEvent(this, eventName);
      }
    }
  };

  proto.one = function(eventName, callback, _binding) {
    let callOnce;
    let notifier;
    let binding = _binding || this;

    notifier = notifierForEvent(this, eventName, true);

    callOnce = function() {
      callback.apply(binding, arguments);
      notifier.removeListener(callOnce, binding);
    };

    notifier.addListener(callOnce, binding);
  };

  proto.emit = function(eventName, ...args) {
    let notifier = notifierForEvent(this, eventName);

    if (notifier) {
      notifier.emit.apply(notifier, args);
    }
  };

  proto.listeners = function(eventName) {
    let notifier = notifierForEvent(this, eventName);
    return notifier ? notifier.listeners : [];
  };
}

export function settleInSeries(obj: Evented, eventName, ...args) {
  const listeners = obj.listeners(eventName);

  return listeners.reduce((chain, [callback, binding]) => {
    return chain
      .then(() => callback.apply(binding, args))
      .catch(e => {
        console.error('Orbit ignored error in event listener', eventName);
        console.error(e.stack || e);
      });
  }, Orbit.Promise.resolve());
}

export function fulfillInSeries(obj: Evented, eventName, ...args) {
  const listeners = obj.listeners(eventName);

  return new Orbit.Promise((resolve, reject) => {
    fulfillEach(listeners, args, resolve, reject);
  });
}

function notifierForEvent(object, eventName, createIfUndefined = false) {
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
    let listener;
    [listener, ...listeners] = listeners;
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
