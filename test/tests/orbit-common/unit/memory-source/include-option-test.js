import Orbit from 'orbit/main';
import { uuid } from 'orbit/lib/uuid';
import Schema from 'orbit-common/schema';
import MemorySource from 'orbit-common/memory-source';
import TransformConnector from 'orbit/transform-connector';
import { Promise } from 'rsvp';
import Operation from 'orbit/operation';

var memorySource;

module("Integration - Memory Source - include option", {
  setup: function() {
    Orbit.Promise = Promise;

    // Create schema
    var schema = new Schema({
      modelDefaults: {
        keys: {
          '__id': {primaryKey: true, defaultValue: uuid},
          'id': {}
        }
      },
      models: {
        star: {
          attributes: {
            name: {type: 'string'}
          },
          links: {
            planets: {type: 'hasMany', model: 'planet', inverse: 'sun'}
          }
        },
        planet: {
          attributes: {
            name: {type: 'string'},
            classification: {type: 'string'}
          },
          links: {
            moons: {type: 'hasMany', model: 'moon', inverse: 'planet'},
            star: {type: 'hasOne', model: 'star', inverse: 'planets'}
          }
        },
        moon: {
          attributes: {
            name: {type: 'string'}
          },
          links: {
            planet: {type: 'hasOne', model: 'planet', inverse: 'moons'},
            mountains: {type: 'hasMany', model: 'mountain', inverse: 'moon'}
          }
        }
      }
    });

    memorySource = new MemorySource(schema);
  },

  teardown: function() {
    memorySource = null;
  }
});

test("find can specify included relationships", function(){
  stop();

  var jupiter = { id: 'planet1', name: 'Jupiter', __rel: { moons: {'moon1': true} } };

  memorySource.reset({
    planet: {
      planet1: jupiter
    },
    moon: {

    }
  });

  var rescueFind = sinon.stub();
  memorySource.on('rescueFind', rescueFind);
  memorySource.find('planet', 'planet1', { include: ['moons'] }).finally(function(){
    start();
    ok(rescueFind.called);
  });
});

test("find can specify nested, included relationships", function(){
  stop();

  var sun = { id: 'star1', name: "Sun", __rel: { planets: { planet1: true } } };
  var jupiter = { id: 'planet1', name: 'Jupiter', __rel: { moons: {'moon1': true} } };
  var europa = { id: 'moon1', name: 'Europa', __rel: { planet: 'planet1' } };

  memorySource.reset({
    star: {
      star1: sun
    },
    planet: {
      planet1: jupiter
    },
    moon: {

    }
  });

  var rescueFind = sinon.spy();
  memorySource.on('rescueFind', rescueFind);

  memorySource.find('star', 'star1', { include: ['planets', 'planets.moons'] }).finally(function(){
    start();
    ok(rescueFind.called);
  });
});

test("findLinked can specify included relationships", function(){
  stop();

  var sun = { id: 'star1', name: "Sun", __rel: { planets: { planet1: true } } };
  var jupiter = { id: 'planet1', name: 'Jupiter', __rel: { moons: {'moon1': true} } };
  var europa = { id: 'moon1', name: 'Europa', __rel: { planet: 'planet1' } };

  memorySource.reset({
    star: {
      star1: sun
    },
    planet: {
      planet1: jupiter
    },
    moon: {

    }
  });

  var rescueFindLinked = sinon.spy();
  memorySource.on('rescueFindLinked', rescueFindLinked);

  memorySource.findLinked('star', 'star1', 'planets', { include: ['moons'] }).finally(function(){
    start();
    ok(rescueFindLinked.called);
  });
});
