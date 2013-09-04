import Orbit from 'orbit/core';

var performAction = function(object, name, args) {
  var capitalizedName = name.charAt(0).toUpperCase() + name.slice(1),
      performableActionName = '_' + name,
      performableAction = object[performableActionName];

  Orbit.assert("Action `" + performableActionName + "` should be defined", performableAction);

  object.trigger('will' + capitalizedName);
  return performableAction.apply(object, args).then(
    function() {
      object.trigger('did' + capitalizedName, arguments);
    }
  );
};

var defineAction = function(object, name) {
  object[name] = function() {
    return performAction(
      object,
      name,
      arguments);
  };
};

var Action = {
  define: function(object, action) {
    Orbit.assert("Object must extend Evented to be able to trigger actions", object.trigger);
    if (typeof action === "object") {
      action.forEach(function(name) {
        defineAction(object, name);
      })
    } else {
      defineAction(object, action);
    }
  }
};

export default Action;