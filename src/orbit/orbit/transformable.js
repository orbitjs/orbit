import Orbit from 'orbit/core';
import Evented from 'orbit/evented';
import Queue from 'orbit/queue';

var settleTransformEvents = function(ops) {
  var _this = this;

  return new Orbit.Promise(function(resolve) {
    var settleEach = function() {
      if (ops.length === 0) {
        resolve();

      } else {
        var op = ops.shift();

        console.log(_this.id, ops.length + 1, 'didTransform', op[0], op[1]);

        var response = _this.settle.call(_this, 'didTransform', op[0], op[1]);

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
};

var applyTransform = function(operation) {
  var _this = this;
  return _this._transform.call(_this, operation).then(
    function(result) {
      if (_this._transformOps.length > 0) {
        return settleTransformEvents.call(_this, _this._transformOps).then(
          function() { return result; }
        );
      } else {
        return result;
      }
    }
  );
};

var Transformable = {
  extend: function(object, actions) {
    if (object._transformable === undefined) {
      object._transformable = true;
      object._transformQueue = new Queue();
      object._transformOps = [];

      Evented.extend(object);

      object.didTransform = function(operation, inverse) {
        object._transformOps.push([operation, inverse]);
      };

      object.transform = function(operation) {
        Orbit.assert('_transform must be defined', object._transform);

        return object._transformQueue.push(
          function() { return applyTransform.call(object, operation); },
          object
        );
      };
    }
    return object;
  }
};

export default Transformable;