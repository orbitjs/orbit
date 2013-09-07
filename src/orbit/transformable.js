import Orbit from 'orbit/core';
import Evented from 'orbit/evented';

var Transformable = {
  extend: function(object) {
    Evented.extend(object);
    return object;
  }
};

export default Transformable;