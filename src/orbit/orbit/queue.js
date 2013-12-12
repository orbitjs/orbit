import Orbit from 'orbit/core';

var Queue = function() {
  this.queue = [];
  this.processing = false;
  this.autoProcess = true;
};

Queue.prototype = {
  constructor: Queue,

  push: function(fn, binding) {
    var _this = this;

    binding = binding || this;

    var response = new Orbit.Promise(function(resolve) {
      _this.queue.push(function() {
        resolve(fn.call(binding));
      });
    });

    if (this.autoProcess) this.process();

    return response;
  },

  process: function() {
    if (!this.processing) {
      var _this = this;

      var settleEach = function() {
        if (_this.queue.length === 0) {
          _this.processing = false;

        } else {
          var fn = _this.queue.shift();
          var response = fn.call(_this);

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
    }
  }
};

export default Queue;