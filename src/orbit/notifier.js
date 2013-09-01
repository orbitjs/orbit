var Notifier = function() {
  this.listeners = [];
};

Notifier.prototype = {
  addListener: function(callback) {
    this.listeners.push(callback);
  },

  removeListener: function(callback) {
    var listeners = this.listeners;
    listeners.forEach(function(listener, index) {
      if (listener === callback) {
        listeners.splice(index, 1);
        return;
      }
    });
  },

  send: function() {
    var _arguments = arguments;
    this.listeners.forEach(function(listener) {
      listener.apply(this, _arguments);
    });
  }
}

export default Notifier;