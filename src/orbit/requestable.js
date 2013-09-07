import Orbit from 'orbit/core';
import Evented from 'orbit/evented';

var performAction = function(object, name, args) {
  var actions = object.poll('will' + Orbit.capitalize(name), args);
  actions.push(object['_' + name]);
  return performActions(false, actions, object, name, args);
};

var performActions = function(afterAction, actions, object, name, args) {
  var action = actions.shift();

  if (!action) {
    if (afterAction) {
      var Name = Orbit.capitalize(name);
      object.emit('didNot' + Name + ' after' + Name, arguments);
      throw new Error('Action could not be completed successfully');
    } else {
      // Notify listeners that the action was not successful, and provide
      // them with the chance to perform it as part of the same promise.
      actions = object.poll('rescue' + Orbit.capitalize(name), args);
      return performActions(true, actions, object, name, args);
    }
  }

  Orbit.assert("Action should be a function", typeof action === "function");

  return action.apply(object, args).then(
    function() {
      var Name = Orbit.capitalize(name);
      object.emit('did' + Name + ' after' + Name, arguments);
    },
    function() {
      return performActions(afterAction, actions, object, name, args);
    }
  );
};

var Requestable = {
  defaultActions: ['find'],

  extend: function(object, actions) {
    if (object._requestable === undefined) {
      this._requestable = true;
      Evented.extend(object);
      this.defineAction(object, actions || this.defaultActions);
    }
    return object;
  },

  defineAction: function(object, action) {
    if (Object.prototype.toString.call(action) === "[object Array]") {
      action.forEach(function(name) {
        this.defineAction(object, name);
      }, this);
    } else {
      object[action] = function() {
        return performAction(
          object,
          action,
          arguments);
      };
    }
  }
};

export default Requestable;