import Orbit from 'orbit/core';

var performAction = function(object, name, args) {
  var capitalizedName = Orbit.capitalize(name),
      performableActionName = '_' + name,
      performableAction = object[performableActionName];

  var alternativeAction = object.poll('will' + capitalizedName, args);
  performableAction = alternativeAction || performableAction;

  Orbit.assert("Action should be a function", typeof performableAction === "function");

  return performableAction.apply(object, args).then(
    function() {
      object.emit('did' + capitalizedName, arguments);
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
    Orbit.assert("Object must extend Evented", object.emit);
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