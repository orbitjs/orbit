import Orbit from 'orbit/core';

var Requestable = function() {
};

Requestable.prototype = {
  /**
   @param {String} type
   @param {String} data
   @param {Object} options
   @return {Object} promise
   */
  find: Orbit.required,

  create: Orbit.required,

  update: Orbit.required,

  destroy: Orbit.required
};

export default Requestable;