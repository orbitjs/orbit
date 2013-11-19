import Orbit from 'orbit/core';
import Evented from 'orbit/evented';

var Transformable = {
  extend: function(object, actions) {
    if (object._requestable === undefined) {
      this._requestable = true;

      Evented.extend(object);

      object.didTransform = function(diff, result) {
        return object.settle.call(object, 'didTransform', diff, result);
      };

      object.transform = function(diff) {
        Orbit.assert('_transform must be defined', object._transform);

        return object._transform.call(object, diff).then(
          function(result) {
            return object.didTransform.call(object, diff, result).then(
              function() {
                return result;
              }
            );
          },
          function(error) {
            return object.settle.call(object, 'didNotTransform', diff, error).then(
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