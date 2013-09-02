import Orbit from 'orbit/core';
import Evented from 'orbit/evented';

var performAction = function(object, name, args) {
  var action = object['perform' + name];
  Orbit.assert("Transformable action should be defined", action);

  object.trigger('will' + name);
  return action.apply(object, args).then(
    function() {
      object.trigger('did' + name, arguments);
    }
  );

};

var Transformable = {
  extend: function(object) {
    Evented.extend(object);
    object.insertObject = this.insertObject;
    object.replaceObject = this.replaceObject;
    object.setProperty = this.setProperty;
    object.removeObject = this.removeObject;
    return object;
  },

  insertObject: function() {
    return performAction(this, 'InsertObject', arguments);
  },

  replaceObject: function() {
    return performAction(this, 'ReplaceObject', arguments);
  },

  setProperty: function() {
    return performAction(this, 'SetProperty', arguments);
  },

  removeObject: function() {
    return performAction(this, 'RemoveObject', arguments);
  }
};

export default Transformable;