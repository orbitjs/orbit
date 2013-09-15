import Orbit from 'orbit/core';
import Evented from 'orbit/evented';
import {ActionHandlerQueue, ActionHandler} from 'orbit/action_handler';

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
            Action = Orbit.capitalize(action);

        Orbit.assert('_' + action + ' must be defined', object['_' + action]);

        var queues = [
          new ActionHandlerQueue('will',    function() {
            return object.poll.apply(object, ['will' + Action].concat(args));
          }),
          new ActionHandlerQueue('default', [object['_' + action]]),
          new ActionHandlerQueue('rescue',  function() {
            return object.poll.apply(object, ['rescue' + Action].concat(args));
          })
        ];

        var actionHandler = new ActionHandler(object, action, args, queues);

        return actionHandler.perform();
      };
    }
  }
};

export default Requestable;