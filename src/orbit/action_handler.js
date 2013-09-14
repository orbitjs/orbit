import Orbit from 'orbit/core';

var ActionHandler = function(object, action, args) {
  this.object = object;
  this.action = action;
  this.args = args;

  this.queues = undefined;
  this.queue = undefined;
  this.error = undefined;
};

ActionHandler.prototype = {
  perform: function() {
    var handler,
        _this = this;

    if (!_this.queue) {
      if (_this.queues) {
        _this.queue = _this.queues.shift();
      }

      if (_this.queue) {
        if (typeof _this.queue.handlers === 'function') {
          _this.queue.handlers = _this.queue.handlers.call(_this);
        }

      } else {
        var Name = Orbit.capitalize(_this.action);
        _this.object.emit.apply(_this.object, ['didNot' + Name].concat(_this.args).concat(_this.error));
        _this.object.emit.apply(_this.object, ['after' + Name].concat(_this.args));
        throw _this.error;
      }
    }

    handler = _this.queue.handlers.shift();

    if (!handler) {
      _this.queue = undefined;
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
        if (_this.queue.name === 'default') {
          _this.error = result;
        }
        return _this.perform.call(_this);
      }
    );
  }
};

export default ActionHandler;