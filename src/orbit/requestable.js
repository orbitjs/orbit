import Orbit from 'orbit/core';
import Evented from 'orbit/evented';
import Action from 'orbit/action';

var Requestable = {
  /**
   `find`, `create`, `update` and `destroy` should all have the following signatures

   @param {String} type
   @param {String} data
   @param {Object} options
   @return {Object} promise
   */
  actionNames: ['find', 'create', 'update', 'destroy'],

  extend: function(object) {
    Evented.extend(object);
    Action.define(object, this.actionNames);
    return object;
  }
};

export default Requestable;