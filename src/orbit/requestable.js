import Orbit from 'orbit/core';
import Evented from 'orbit/evented';
import RSVP from 'rsvp';

var performUntilSuccess = function(handlers, object, args) {
  return handlers.shift().apply(object, args).then(
    null,
    function(error) {
      if (handlers.length > 0) {
        return performUntilSuccess(handlers, object, args);
      } else {
        throw error;
      }
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
        Orbit.assert('_' + action + ' must be defined', object['_' + action]);

        var args = Array.prototype.slice.call(arguments, 0),
            Action = Orbit.capitalize(action),
            handlers = object.poll.apply(object, ['will' + Action].concat(args));

        handlers.push(object['_' + action]);

        return performUntilSuccess(handlers, object, args).then(
          null,
          function(error) {
            handlers = object.poll.apply(object, ['rescue' + Action].concat(args));
            if (handlers.length > 0) {
              return performUntilSuccess(handlers, object, args).then(
                null,
                function() {
                  throw error;
                }
              );
            } else {
              throw error;
            }
          }
        ).then(
          function(result) {
            return RSVP.all(object.poll.apply(object, ['did' + Action].concat(args).concat(result))).then(
              function() { return result; }
            );
          },
          function(error) {
            return RSVP.all(object.poll.apply(object, ['didNot' + Action].concat(args).concat(error))).then(
              function() { throw error; }
            );
          }
        );
      };
    }
  }
};

export default Requestable;