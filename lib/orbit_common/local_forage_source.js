import Orbit from 'orbit/main';
import { assert } from 'orbit/lib/assert';
import { extend } from 'orbit/lib/objects';
import MemorySource from './memory_source';


var supportsLocalStorage = function() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch(e) {
    return false;
  }
};

/**
 Source for storing data with local forage (https://github.com/mozilla/localForage)
 
 @class LocalForageSource
 @extends MemorySource
 @namespace OC
 @param {OC.Schema} schema
 @param {Object}    [options]
 @constructor
 */
var LocalForageSource = function() {
  this.init.apply(this, arguments);
};

extend(LocalForageSource.prototype, MemorySource.prototype, {
  constructor: LocalForageSource,

  init: function(schema, options) {
    assert('Your browser does not support local storage!', supportsLocalStorage()); //needed as final fallback
    assert('No valid local forage object given', options['localforage'] !== undefined);
    assert('Local forage requires Orbit.Promise be defined', Orbit.Promise);

    var _this = this;
    
    MemorySource.prototype.init.apply(this, arguments);

    options = options || {};
    this.saveDataCallback = options['saveDataCallback'];
    this.loadDataCallback = options['loadDataCallback'];
    this.namespace = options['namespace'] || 'orbit'; // local storage key
    this._autosave = options['autosave'] !== undefined ? options['autosave'] : true;
    this.webSQLSize = options['webSQLSize'] !== undefined ? options['webSQLSize'] : 4980736;
    var autoload = options['autoload'] !== undefined ? options['autoload'] : true;
    this.localforage = options['localforage'];

    this.localforage.config({
      name        : 'orbitjs',
      version     : 1.0,
      size        : this.webSQLSize,
      storeName   : this.namespace,
      description : 'orbitjs localforage adapter'
    });

    this._isDirty = false;

    this.on('didTransform', function() {
      return this._saveData().then(function(){
        if (options.saveDataCallback) setTimeout(_this.saveDataCallback, 0);
      });
    }, this);

    if (autoload) this.load().then(function() {
      if (options.loadDataCallback) setTimeout(options.callback, 0);
    });
  },

  load: function() {
    var _this = this;
    return new Orbit.Promise(function(resolve, reject) {
      _this.localforage.getItem(this.namespace).then(function(storage){
        _this.reset(JSON.parse(storage));
        resolve();
      });
    });
  },

  enableAutosave: function() {
    if (!this._autosave) {
      this._autosave = true;
      if (this._isDirty) this._saveData();
    }
  },

  disableAutosave: function() {
    if (this._autosave) {
      this._autosave = false;
    }
  },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _saveData: function(forceSave) {
    var _this = this; //bind not supported in older browsers
    if (!this._autosave && !forceSave) {
      this._isDirty = true;
      return;
    }
    return this.localforage.setItem(this.namespace, this.retrieve()).then(
      function() {
        _this._isDirty = false;
      }
    );

  }
});

export default LocalForageSource;
