import Orbit from 'orbit/core';
import Evented from 'orbit/evented';
import Queue from 'orbit/queue';

var applyTransform = function(operation) {
  var _this = this;
  return _this._transform.call(_this, operation).then(
    function(result) {
      return _this.didTransform.call(_this, operation, result).then(
        function() {
          return result;
        }
      );
    },
    function(error) {
      return _this.settle.call(_this, 'didNotTransform', operation, error).then(
        function() {
          throw error;
        }
      );
    }
  );
};

var Transformable = {
  extend: function(object, actions) {
    if (object._transformable === undefined) {
      object._transformable = true;
      object._transformQueue = new Queue();

      Evented.extend(object);

      object.didTransform = function(operation, result) {
        return object.settle.call(object, 'didTransform', operation, result);
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