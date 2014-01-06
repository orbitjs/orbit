import Orbit from 'orbit/core';
import Notifier from 'orbit/notifier';

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

var Evented = {
  extend: function(object) {
    Orbit.assert('Evented requires Orbit.Promise be defined', Orbit.Promise);

    if (object._evented === undefined) {
      Orbit.extend(object, this.interface);
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

      return listeners;
    },

    resolve: function(eventNames) {
      var listeners = this.listeners(eventNames),
          args = Array.prototype.slice.call(arguments, 1);

      return new Orbit.Promise(function(resolve, reject) {
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
      var listeners = this.listeners(eventNames),
          args = Array.prototype.slice.call(arguments, 1);

      return new Orbit.Promise(function(resolve) {
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
  }
};

export default Evented;