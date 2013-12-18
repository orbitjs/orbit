import Orbit from 'orbit/core';
import Evented from 'orbit/evented';
import TransformQueue from 'orbit/transform_queue';

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

var Transformable = {
  extend: function(object, actions) {
    if (object._transformable === undefined) {
      object._transformable = true;
      object.transformQueue = new TransformQueue(object);
      object._completedTransforms = [];

      Evented.extend(object);

      object.didTransform = function(operation, inverse) {
        object._completedTransforms.push([operation, inverse]);
      };

      object.transform = function(operation) {
        Orbit.assert('_transform must be defined', object._transform);

        return object.transformQueue.push(operation).then(
          function(result) {
            if (object._completedTransforms.length > 0) {
              return settleTransformEvents.call(object, object._completedTransforms).then(
                function() {
                  return result;
                }
              );
            } else {
              return result;
            }
          }
        );
      };
    }
    return object;
  }
};

export default Transformable;