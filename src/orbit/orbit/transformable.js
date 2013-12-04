import Orbit from 'orbit/core';
import Evented from 'orbit/evented';

var Transformable = {
  extend: function(object, actions) {
    if (object._requestable === undefined) {
      this._requestable = true;

      Evented.extend(object);

      object.didTransform = function(operation, result) {
        return object.settle.call(object, 'didTransform', operation, result);
      };

      object.transform = function(operation) {
        Orbit.assert('_transform must be defined', object._transform);

        return object._transform.call(object, operation).then(
          function(result) {
            return object.didTransform.call(object, operation, result).then(
              function() {
                return result;
              }
            );
          },
          function(error) {
            return object.settle.call(object, 'didNotTransform', operation, error).then(
              function() {
                throw error;
              }
            );
          }
        );
      };
    }
    return object;
  }
};

export default Transformable;