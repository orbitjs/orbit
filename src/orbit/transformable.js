import Orbit from 'orbit/core';
import Evented from 'orbit/evented';

var performAction = function(object, name, args) {
  var performableActionName = 'perform' + name,
      performableAction = object[performableActionName];

  Orbit.assert("Transformable action `" + performableActionName + "` should be defined", performableAction);

  object.trigger('will' + name);
  return performableAction.apply(object, args).then(
    function() {
      object.trigger('did' + name, arguments);
    }
  );
};

var Transformable = {
  extend: function(object) {
    Evented.extend(object);
    ['insertObject',
     'replaceObject',
     'setProperty',
     'removeObject'].forEach(function(method) {

      object[method] = function() {
        return performAction(object,
          method.charAt(0).toUpperCase() + method.slice(1),
          arguments);
      };
    });
    return object;
  }
};

export default Transformable;