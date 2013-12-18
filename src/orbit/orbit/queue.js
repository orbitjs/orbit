import Orbit from 'orbit/core';

var Queue = function() {
  this.queue = [];
  this.ops = []; // TODO - remove
  this.processing = false;
  this.autoProcess = true;
};

Queue.prototype = {
  constructor: Queue,

  push: function(fn, binding) {
    var _this = this;

    binding = binding || this;

    console.log(_this.id, 'queue - push', _this.ops);

    var response = new Orbit.Promise(function(resolve) {
      _this.queue.push(function() {
        fn.call(binding).then(function(result) {
          resolve(result);
        });
      });
    });

    if (this.autoProcess) this.process();

    return response;
  },

  process: function() {
    if (!this.processing) {
      var _this = this;

      _this.processing = true;

      var settleEach = function() {
        if (_this.queue.length === 0) {

          _this.processing = false;
          console.log(_this.id, 'END - process queue', _this.queue.length);

        } else {
          console.log(_this.id, 'START - process queue', _this.queue.length, _this.ops.shift());
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