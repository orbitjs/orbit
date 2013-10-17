import Orbit from 'orbit/core';
import Evented from 'orbit/evented';

var Transformable = {
  extend: function(object, actions) {
    if (object._requestable === undefined) {
      this._requestable = true;

      Evented.extend(object);

      object.didTransform = function(action, type, data) {
        return object.settle.call(object, 'didTransform', action, type, data);
      };

      object.transform = function(action, type, data) {
        Orbit.assert('_transform must be defined', object._transform);

        return object._transform.call(object, action, type, data).then(
          function(result) {
            return object.didTransform.call(object, action, type, result).then(
              function() {
                return result;
              }
            );
          },
          function(error) {
            return object.settle.call(object, 'didNotTransform', action, type, data, error).then(
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