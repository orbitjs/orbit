import Orbit from 'orbit/core';
import Notifier from 'orbit/notifier';

var Transformable = function() {
  this.notifier = new Notifier();
};

Transformable.prototype = {
  insertObject: function() {
    this.action('insertObject', arguments);
  },

  replaceObject: function() {
    this.action('replaceObject', arguments);
  },

  setProperty: function() {
    this.action('setProperty', arguments);
  },

  removeObject: function() {
    this.action('removeObject', arguments);
  },

  action: function(name, args) {
    var _this = this;
    _this.notifier.send('will' + name);

    return this['perform' + name].apply(this, args).then(
      null,
      function() {
        _this.notifier.send('did' + name);
      }
    );
  },

  performInsertObject: Orbit.required,

  performReplaceObject: Orbit.required,

  performSetProperty: Orbit.required,

  performRemoveObject: Orbit.required
};

export default Transformable;