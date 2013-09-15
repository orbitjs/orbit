import Orbit from 'orbit/core';
import Evented from 'orbit/evented';

var Transformable = {
  extend: function(object) {
    Evented.extend(object);

    object.transform = function() {
      var args = Array.prototype.slice.call(arguments, 0);

      object.emit.apply(object, ['willTransform'].concat(args));

      Orbit.assert("_transform must be defined", object._transform);

      return object._transform.apply(object, args).then(
        function(result) {
          object.emit.apply(object, ['didTransform'].concat(args).concat([result]));
          return result;
        },
        function(result) {
          object.emit.apply(object, ['didNotTransform'].concat(args).concat([result]));
          throw result;
        }
      );
    };

    return object;
  }
};

export default Transformable;