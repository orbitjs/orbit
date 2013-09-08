import Orbit from 'orbit/core';
import Evented from 'orbit/evented';

var performAction = function(object, name, args) {
  var actions = object.poll('will' + Orbit.capitalize(name), args);
  return performActions('pre', actions, null, object, name, args);
};

var performActions = function(state, actions, error, object, name, args) {
  var action = actions.shift();

  if (!action) {
    if (state === 'pre') {
      actions = [object['_' + name]];
      state = 'current';

    } else if (state === 'current') {
      actions = object.poll('rescue' + Orbit.capitalize(name), args);
      state = 'post';

    } else {
      var Name = Orbit.capitalize(name);
      object.emit('didNot' + Name + ' after' + Name, args);
      throw error || 'Action could not be completed successfully';
    }
    return performActions(state, actions, error, object, name, args);
  }

  Orbit.assert("Action should be a function", typeof action === "function");

  return action.apply(object, args).then(
    function(result) {
      var Name = Orbit.capitalize(name);
      object.emit('did' + Name + ' after' + Name, args);
      return result;
    },
    function(result) {
      if (state === 'current') {
        error = result;
      }
      return performActions(state, actions, error, object, name, args);
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