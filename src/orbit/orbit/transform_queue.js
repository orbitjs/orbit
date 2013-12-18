import Orbit from 'orbit/core';

var TransformQueue = function(target) {
  this.target = target;
  this._queue = [];
  this.processing = false;
  this.autoProcess = true;
};

TransformQueue.prototype = {
  constructor: TransformQueue,

  push: function(operation) {
    var _this = this;

    console.log('>>>> TransformQueue', _this.target.id, operation);

    var response = new Orbit.Promise(function(resolve) {
      var transform = {
        resolver: function() {
          return _this.target._transform.call(_this.target, operation).then(
            function(result) {
              resolve(result);
            }
          );
        },
        op: operation
      };

      _this._queue.push(transform);
    });

    if (this.autoProcess) this.process();

    return response;
  },

  process: function() {
    if (!this.processing) {
      var _this = this;

      _this.processing = true;

      var settleEach = function() {
        if (_this._queue.length === 0) {

          _this.processing = false;
          console.log('---- TransformQueue', _this.target.id, 'EMPTY');

        } else {
          var transform = _this._queue.shift();

          console.log('<<<< TransformQueue', _this.target.id, transform.operation);

          return transform.resolver.call(_this).then(
            function(success) {
              settleEach();
            },
            function(error) {
              settleEach();
            }
          );
        }
      };

      settleEach();
    }
  }
};

export default TransformQueue;