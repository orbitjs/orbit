import Orbit from 'orbit/core';

var defineAction = function(object, name) {
  object[name] = function() {
    return performAction(
      object,
      name,
      arguments);
  };
};

var performAction = function(object, name, args) {
  var actions = object.poll('will' + Orbit.capitalize(name), args);
  actions.push(object['_' + name]);
  return performActions(actions, object, name, args);
};

var performActions = function(actions, object, name, args) {
  var action = actions.shift();

  Orbit.assert("No actions could be completed successfully", action);
  Orbit.assert("Action should be a function", typeof action === "function");

  return action.apply(object, args).then(
    function() {
      object.emit('did' + Orbit.capitalize(name), arguments);
    },
    function() {
      return performActions(actions, object, name, args);
    }
  );
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