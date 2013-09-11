import Orbit from 'orbit/core';
import Evented from 'orbit/evented';

var performAction = function(name) {
  var args = Array.prototype.slice.call(arguments, 1);
  var handlers = this.poll.apply(this, ['will' + Orbit.capitalize(name)].concat(args));
  return performActionHandlers('will', handlers, null, this, name, args);
};

var performActionHandlers = function(queue, handlers, error, object, name, args) {
  var handler = handlers.shift();

  if (!handler) {
    if (queue === 'will') {
      handlers = [object['_' + name]];
      queue = 'default';

    } else if (queue === 'default') {
      handlers = object.poll.apply(object, ['rescue' + Orbit.capitalize(name)].concat(args));
      queue = 'rescue';

    } else {
      var Name = Orbit.capitalize(name);
      object.emit.apply(object, ['didNot' + Name].concat(args).concat(error));
      object.emit.apply(object, ['after' + Name].concat(args));
      throw error; // raise the error from the default handler
    }
    return performActionHandlers(queue, handlers, error, object, name, args);
  }

  Orbit.assert("Action handler should be a function", typeof handler === "function");

  return handler.apply(object, args).then(
    function(result) {
      var Name = Orbit.capitalize(name);
      object.emit.apply(object, ['did' + Name].concat(args).concat(result));
      object.emit.apply(object, ['after' + Name].concat(args));
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
        return performAction.apply(object, [action].concat(Array.prototype.slice.call(arguments, 0)));
      };
    }
  }
};

export default Requestable;