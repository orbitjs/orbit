import Orbit from 'orbit/core';
import Evented from 'orbit/evented';

var Transformable = {
  defaultActions: ['insertRecord', 'updateRecord', 'patchRecord', 'destroyRecord'],

  extend: function(object, actions, options) {
    if (object._requestable === undefined) {
      this._requestable = true;
      Evented.extend(object);

      options = options || {};
      this.defineAction(object, actions || this.defaultActions, options);
    }
    return object;
  },

  defineAction: function(object, action, options) {
    if (Object.prototype.toString.call(action) === "[object Array]") {
      action.forEach(function(name) {
        this.defineAction(object, name);
      }, this);
    } else {
      var Action = Orbit.capitalize(action);

      object['did' + Action] = function(type, data) {
        return object.settle.call(object, 'did' + Action, type, data);
      };

      object[action] = function(type, data) {
        Orbit.assert('_' + action + ' must be defined', object['_' + action]);

        var args = Array.prototype.slice.call(arguments, 0);
        return object['_' + action].apply(object, args).then(
          function(result) {
            return object['did' + Action].call(object, type, result).then(
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

export default Transformable;