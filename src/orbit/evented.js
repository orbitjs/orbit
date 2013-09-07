import Notifier from 'orbit/notifier';

var notifierForEvent = function(object, eventName, createIfUndefined) {
  var notifier = object._eventedNotifiers[eventName];
  if (!notifier && createIfUndefined) {
    notifier = object._eventedNotifiers[eventName] = new Notifier;
  }
  return notifier;
};

var Evented = {
  extend: function(object) {
    object._eventedNotifiers = {};
    object.on = this.on;
    object.off = this.off;
    object.emit = this.emit;
    object.poll = this.poll;
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
  }
};

export default Evented;