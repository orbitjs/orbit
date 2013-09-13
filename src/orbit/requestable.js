import Orbit from 'orbit/core';
import Evented from 'orbit/evented';

var ActionHandler = function(object, action, args) {
  this.object = object;
  this.action = action;
  this.args = args;

  this.queues = ['will', 'default', 'rescue'];
  this.queue = undefined;
  this.handlers = undefined;
  this.error = undefined;
};

ActionHandler.prototype = {
  retrieveHandlers: function() {
    if (this.queue === 'will') {
      this.handlers = this.object.poll.apply(this.object, ['will' + Orbit.capitalize(this.action)].concat(this.args));

    } else if (this.queue === 'default') {
      this.handlers = [this.object['_' + this.action]];

    } else if (this.queue === 'rescue') {
      this.handlers = this.object.poll.apply(this.object, ['rescue' + Orbit.capitalize(this.action)].concat(this.args));
    }
  },

  perform: function() {
    var handler,
        _this = this;

    if (_this.handlers) {
      handler = _this.handlers.shift();
    }

    if (!handler) {
      _this.queue = _this.queues.shift();

      if (_this.queue) {
        _this.retrieveHandlers();

      } else {
        var Name = Orbit.capitalize(_this.action);
        _this.object.emit.apply(_this.object, ['didNot' + Name].concat(_this.args).concat(_this.error));
        _this.object.emit.apply(_this.object, ['after' + Name].concat(_this.args));
        throw _this.error;
      }

      return _this.perform.call(_this);
    }

    Orbit.assert("Action handler should be a function", typeof handler === "function");

    return handler.apply(_this.object, _this.args).then(
      function(result) {
        var Name = Orbit.capitalize(_this.action);
        _this.object.emit.apply(_this.object, ['did' + Name].concat(_this.args).concat(result));
        _this.object.emit.apply(_this.object, ['after' + Name].concat(_this.args));
        return result;
      },
      function(result) {
        if (_this.queue === 'default') {
          _this.error = result;
        }
        return _this.perform.call(_this);
      }
    );
  }
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
        var args = Array.prototype.slice.call(arguments, 0),
            actionHandler = new ActionHandler(object, action, args);

        return actionHandler.perform();
      };
    }
  }
};

export default Requestable;