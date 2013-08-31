import Orbit from 'orbit/core';

var Transformable = function() {
};

Transformable.prototype = {
  /**
   @param {Object}

   */
  insertObject: Orbit.required,

  replaceObject: Orbit.required,

  setProperty: Orbit.required,

  removeObject: Orbit.required
};

export default Transformable;