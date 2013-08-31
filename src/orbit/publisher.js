var Publisher = function() {
  this.subscribers = [];
};

Publisher.prototype = {
  addSubscriber: function(callback) {
    this.subscribers.push(callback);
  },

  removeSubscriber: function(callback) {
    var subscribers = this.subscribers;
    subscribers.forEach(function(subscriber, index) {
      if (subscriber === callback) {
        subscribers.splice(index, 1);
        return;
      }
    });
  },

  publish: function() {
    var _arguments = arguments;
    this.subscribers.forEach(function(subscriber) {
      subscriber.apply(this, _arguments);
    });
  }
}

export default Publisher;