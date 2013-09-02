var Notifier = function() {
  this.listeners = [];
};

Notifier.prototype = {
  addListener: function(callback, binding) {
    binding = binding || this;
    this.listeners.push([callback, binding]);
  },

  removeListener: function(callback, binding) {
    binding = binding || this;
    var listeners = this.listeners;
    listeners.forEach(function(listener, index) {
      if (listener[0] === callback && listener[1] === binding) {
        listeners.splice(index, 1);
        return;
      }
    });
  },

  send: function() {
    var _arguments = arguments;
    this.listeners.forEach(function(listener) {
      listener[0].apply(listener[1], _arguments);
    });
  }
}

export default Notifier;