import Orbit from 'orbit/core';
import Publisher from 'orbit/publisher';

var Requestable = function() {
  this.notifier = new Publisher();
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