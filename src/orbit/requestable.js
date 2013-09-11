import Orbit from 'orbit/core';
import Evented from 'orbit/evented';

var performActionHandlers = function(action, args, handlers, queue, defaultHandlerError) {
  var _this = this,
      handler = handlers.shift();

  if (!handler) {
    if (queue === 'will') {
      handlers = [_this['_' + action]];
      queue = 'default';

    } else if (queue === 'default') {
      handlers = _this.poll.apply(_this, ['rescue' + Orbit.capitalize(action)].concat(args));
      queue = 'rescue';

    } else {
      var Name = Orbit.capitalize(action);
      _this.emit.apply(_this, ['didNot' + Name].concat(args).concat(defaultHandlerError));
      _this.emit.apply(_this, ['after' + Name].concat(args));
      throw defaultHandlerError;
    }

    return performActionHandlers.call(_this, action, args, handlers, queue, defaultHandlerError);
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
      return performActionHandlers.call(_this, action, args, handlers, queue, defaultHandlerError);
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
        var args = Array.prototype.slice.call(arguments, 0);
        var handlers = this.poll.apply(object, ['will' + Orbit.capitalize(action)].concat(args));
        return performActionHandlers.call(object, action, args, handlers, 'will');
      };
    }
  }
};

export default Requestable;