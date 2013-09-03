import Orbit from 'orbit/core';
import Evented from 'orbit/evented';

var performAction = function(object, name, args) {
  var performableActionName = 'perform' + name,
      action = object[performableActionName];

  Orbit.assert("Requestable action `" + performableActionName + "` should be defined", action);

  object.trigger('will' + name);
  return action.apply(object, args).then(
    function() {
      object.trigger('did' + name, arguments);
    }
  );
};

var Requestable = {
  /**
   `find`, `create`, `update` and `destroy` should all have the following signatures

   @param {String} type
   @param {String} data
   @param {Object} options
   @return {Object} promise
   */
  extend: function(object) {
    Evented.extend(object);
    ['find',
     'create',
     'update',
     'destroy'].forEach(function(method) {

      object[method] = function() {
        return performAction(this,
          method.charAt(0).toUpperCase() + method.slice(1),
          arguments);
      };
    });
    return object;
  }
};

export default Requestable;