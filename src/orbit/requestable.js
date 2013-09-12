import Orbit from 'orbit/core';
import Evented from 'orbit/evented';

var nextQueue = function(queue) {
  if (queue === undefined) {
    return 'will';
  } else if (queue === 'will') {
    return 'default';
  } else if (queue === 'default') {
    return 'rescue';
  } else {
    return null;
  }
};

var actionHandlers = function(action, args, queue) {
  if (queue === 'will') {
    return this.poll.apply(this, ['will' + Orbit.capitalize(action)].concat(args));

  } else if (queue === 'default') {
    return [this['_' + action]];

  } else if (queue === 'rescue') {
    return this.poll.apply(this, ['rescue' + Orbit.capitalize(action)].concat(args));

  }
};

var performAction = function(action, args, handlers, queue, defaultHandlerError) {
  var _this = this,
      handler;

  if (handlers) {
    handler = handlers.shift();
  }

  if (!handler) {
    queue = nextQueue(queue);

    if (queue) {
      handlers = actionHandlers.call(this, action, args, queue);

    } else {
      var Name = Orbit.capitalize(action);
      _this.emit.apply(_this, ['didNot' + Name].concat(args).concat(defaultHandlerError));
      _this.emit.apply(_this, ['after' + Name].concat(args));
      throw defaultHandlerError;
    }

    return performAction.call(_this, action, args, handlers, queue, defaultHandlerError);
  }

  Orbit.assert("Action handler should be a function", typeof handler === "function");

  return handler.apply(_this, args).then(
    function(result) {
      var Name = Orbit.capitalize(action);
      _this.emit.apply(_this, ['did' + Name].concat(args).concat(result));
      _this.emit.apply(_this, ['after' + Name].concat(args));
      return result;
    },
    function(result) {
      if (queue === 'default') {
        defaultHandlerError = result;
      }
      return performAction.call(_this, action, args, handlers, queue, defaultHandlerError);
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
        return performAction.call(object, action, Array.prototype.slice.call(arguments, 0));
      };
    }
  }
};

export default Requestable;