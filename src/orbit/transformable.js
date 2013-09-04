import Orbit from 'orbit/core';
import Evented from 'orbit/evented';
import Action from 'orbit/action';

var Transformable = {
  extend: function(object) {
    Evented.extend(object);
    Action.define(object, ['insertObject', 'replaceObject', 'setProperty', 'removeObject']);
    return object;
  }
};

export default Transformable;