import Orbit from 'orbit/core';
import Evented from 'orbit/evented';
import ActionHandler from 'orbit/action_handler';
import ActionHandlerQueue from 'orbit/action_handler_queue';

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

        actionHandler.queues = [
          new ActionHandlerQueue('will',    function() {
            return this.object.poll.apply(this.object, ['will' + Orbit.capitalize(this.action)].concat(this.args));
          }),
          new ActionHandlerQueue('default', [actionHandler.object['_' + actionHandler.action]]),
          new ActionHandlerQueue('rescue',  function() {
            return this.object.poll.apply(this.object, ['rescue' + Orbit.capitalize(this.action)].concat(this.args));
          })
        ];

        return actionHandler.perform();
      };
    }
  }
};

export default Requestable;