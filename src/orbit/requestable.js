import Orbit from 'orbit/core';
import Evented from 'orbit/evented';

var performAction = function(object, name, args) {
  var handlers = object.poll('will' + Orbit.capitalize(name), args);
  return performActionHandlers('will', handlers, null, object, name, args);
};

var performActionHandlers = function(queue, handlers, error, object, name, args) {
  var handler = handlers.shift();

  if (!handler) {
    if (queue === 'will') {
      handlers = [object['_' + name]];
      queue = 'default';

    } else if (queue === 'default') {
      handlers = object.poll('rescue' + Orbit.capitalize(name), args);
      queue = 'rescue';

    } else {
      var Name = Orbit.capitalize(name);
      object.emit('didNot' + Name + ' after' + Name, args);
      throw error; // raise the error from the default handler
    }
    return performActionHandlers(queue, handlers, error, object, name, args);
  }

  Orbit.assert("Action handler should be a function", typeof handler === "function");

  return handler.apply(object, args).then(
    function(result) {
      var Name = Orbit.capitalize(name);
      object.emit('did' + Name + ' after' + Name, args);
      return result;
    },
    function(result) {
      // Only capture the error from the default handler
      if (queue === 'default') {
        error = result;
      }
      return performActionHandlers(queue, handlers, error, object, name, args);
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