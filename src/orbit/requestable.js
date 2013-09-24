import Orbit from 'orbit/core';
import Evented from 'orbit/evented';

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

        var args = Orbit.toArray(arguments),
            Action = Orbit.capitalize(action);

        return object.resolve.apply(object, ['assist' + Action].concat(args)).then(
          null,
          function() {
            return object['_' + action].apply(object, args);
          }
        ).then(
          null,
          function(error) {
            return object.resolve.apply(object, ['rescue' + Action].concat(args)).then(
              null,
              function() {
                throw error;
              }
            );
          }
        ).then(
          function(result) {
            return object.settle.apply(object, ['did' + Action].concat(args).concat(result)).then(
              function() {
                return result;
              }
            );
          },
          function(error) {
            return object.settle.apply(object, ['didNot' + Action].concat(args).concat(error)).then(
              function() {
                throw error;
              }
            );
          }
        );
      };
    }
  }
};

export default Requestable;