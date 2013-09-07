import Orbit from 'orbit/core';
import Evented from 'orbit/evented';
import Action from 'orbit/action';

var Requestable = {
  defaultActions: ['find'],

  extend: function(object, actions) {
    Evented.extend(object);
    Action.define(object, actions || this.defaultActions);
    return object;
  }
};

export default Requestable;