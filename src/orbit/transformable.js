import Orbit from 'orbit/core';
import Evented from 'orbit/evented';
import Action from 'orbit/action';

var Transformable = {
  extend: function(object) {
    Evented.extend(object);
    Action.define(object, 'insertObject');
    Action.define(object, 'replaceObject');
    Action.define(object, 'setProperty');
    Action.define(object, 'removeObject');
    return object;
  }
};

export default Transformable;