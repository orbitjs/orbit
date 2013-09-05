import Notifier from 'orbit/notifier';

var notifierForEvent = function(object, eventName) {
  var notifier = object._eventedNotifiers[eventName];
  if (!notifier) {
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
      notifierForEvent(_this, eventName).addListener(callback, binding);
    });
  },

  off: function(eventNames, callback, binding) {
    var _this = this;
    binding = binding || this;

    eventNames.split(/\s+/).forEach(function(eventName) {
      notifierForEvent(_this, eventName).removeListener(callback, binding);
    });
  },

  emit: function(eventName) {
    var notifier = notifierForEvent(this, eventName),
        args = Array.prototype.slice.call(arguments, 1);

    notifier.emit.apply(notifier, args);
  },

  poll: function(eventName) {
    var notifier = notifierForEvent(this, eventName),
        args = Array.prototype.slice.call(arguments, 1);

    return notifier.poll.apply(notifier, args);
  }
};

export default Evented;