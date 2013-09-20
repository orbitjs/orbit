import Notifier from 'orbit/notifier';
import RSVP from 'rsvp';

var notifierForEvent = function(object, eventName, createIfUndefined) {
  var notifier = object._eventedNotifiers[eventName];
  if (!notifier && createIfUndefined) {
    notifier = object._eventedNotifiers[eventName] = new Notifier();
  }
  return notifier;
};

var Evented = {
  extend: function(object) {
    if (object._evented === undefined) {
      object._evented = true;
      object._eventedNotifiers = {};
      object.on = this.on;
      object.off = this.off;
      object.emit = this.emit;
      object.poll = this.poll;
      object.listeners = this.listeners;
      object.resolve = this.resolve;
      object.settle = this.settle;
    }
    return object;
  },

  on: function(eventNames, callback, binding) {
    var _this = this;
    binding = binding || this;

    eventNames.split(/\s+/).forEach(function(eventName) {
      notifierForEvent(_this, eventName, true).addListener(callback, binding);
    });
  },

  off: function(eventNames, callback, binding) {
    var _this = this,
        notifier;

    binding = binding || this;

    eventNames.split(/\s+/).forEach(function(eventName) {
      notifier = notifierForEvent(_this, eventName);
      if (notifier) {
        notifier.removeListener(callback, binding);
      }
    });
  },

  emit: function(eventNames) {
    var _this = this,
        args = Array.prototype.slice.call(arguments, 1),
        notifier;

    eventNames.split(/\s+/).forEach(function(eventName) {
      notifier = notifierForEvent(_this, eventName);
      if (notifier) {
        notifier.emit.apply(notifier, args);
      }
    });
  },

  poll: function(eventNames) {
    var _this = this,
        args = Array.prototype.slice.call(arguments, 1),
        notifier,
        responses = [];

    eventNames.split(/\s+/).forEach(function(eventName) {
      notifier = notifierForEvent(_this, eventName);
      if (notifier) {
        responses = responses.concat(notifier.poll.apply(notifier, args));
      }
    });

    return responses;
  },

  listeners: function(eventNames) {
    var _this = this,
        notifier,
        listeners = [];

    eventNames.split(/\s+/).forEach(function(eventName) {
      notifier = notifierForEvent(_this, eventName);
      if (notifier) {
        listeners = listeners.concat(notifier.listeners);
      }
    });

    return listeners;
  },

  resolve: function(eventNames) {
    var _this = this,
        listeners = this.listeners(eventNames),
        args = Array.prototype.slice.call(arguments, 1);

    return new RSVP.Promise(function(resolve, reject) {
      var resolveEach = function() {
        if (listeners.length === 0) {
          reject();
        } else {
          var listener = listeners.shift();
          var response = listener[0].apply(listener[1], args);

          if (response) {
            response.then(
              function(success) {
                resolve(success);
              },
              function(error) {
                resolveEach();
              }
            );
          } else {
            resolveEach();
          }
        }
      };

      resolveEach();
    });
  },

  settle: function(eventNames) {
    var _this = this,
        listeners = this.listeners(eventNames),
        args = Array.prototype.slice.call(arguments, 1);

    return new RSVP.Promise(function(resolve, reject) {
      var settleEach = function() {
        if (listeners.length === 0) {
          resolve();
        } else {
          var listener = listeners.shift(),
              response = listener[0].apply(listener[1], args);

          if (response) {
            return response.then(
              function(success) {
                settleEach();
              },
              function(error) {
                settleEach();
              }
            );
          } else {
            settleEach();
          }
        }
      };

      settleEach();
    });
  }
};

export default Evented;