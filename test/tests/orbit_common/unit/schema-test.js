import Orbit from 'orbit/main';
import Schema from 'orbit-common/schema';
import { Promise } from 'rsvp';

///////////////////////////////////////////////////////////////////////////////

module("OC - Schema", {
  setup: function() {
    Orbit.Promise = Promise;
  }
});

test("it exists", function() {
  var schema = new Schema();
  ok(schema);
});

test("it has an `idField`, `remoteIdField` and `generateId` set by default", function() {
  var schema = new Schema();
  equal(schema.idField, '__id', 'idField has been set');
  equal(schema.remoteIdField, 'id', 'remoteIdField has been set');
  ok(schema.generateId, 'generateId has been set');
});

test("`idField`, `remoteIdField` and `generateId` can be overridden", function() {
  var customIdGenerator = function() {
    return Math.random().toString(); // don't do this ;)
  };

  var schema = new Schema({
    idField: 'id',
    remoteIdField: '_id',
    generateId: customIdGenerator
  });

  equal(schema.idField, 'id', 'custom idField has been set');
  equal(schema.remoteIdField, '_id', 'custom remoteIdField has been set');
  strictEqual(schema.generateId, customIdGenerator, 'custom generateId has been set');
});

test("#normalize initializes a record with a unique idField", function() {
  var schema = new Schema({
    models: {
      planet: {}
    }
  });

  var earth = schema.normalize('planet', {});
  var mars = schema.normalize('planet', {});

  ok(earth.__id, 'idField has been set');
  ok(mars.__id, 'idField has been set');
  notEqual(earth.__id, mars.__id, 'ids are unique');
});

test("#normalize initializes a record's attributes with any defaults that are specified with a value or function", function() {
  var schema = new Schema({
    models: {
      planet: {
        attributes: {
          name: {type: 'string', defaultValue: 'Earth'},
          shape: {type: 'string'},
          classification: {type: 'string', defaultValue: function() {
            return 'terrestrial';
          }},
          hasWater: {type: 'boolean', defaultValue: false}
        }
      }
    }
  });

  var earth = schema.normalize('planet', {});

  strictEqual(earth.name, 'Earth', 'default has been set by value');
  strictEqual(earth.shape, null, 'default has not been set - should be null');
  strictEqual(earth.classification, 'terrestrial', 'default has been set by function');
  strictEqual(earth.hasWater, false, 'default has not been set - should be false');
});

test("#normalize initializes a record's links", function() {
  var schema = new Schema({
    models: {
      planet: {
        links: {
          moons: {type: 'hasMany', model: 'moon', inverse: 'planet'}
        }
      },
      moon: {
        links: {
          planet: {type: 'hasOne', model: 'planet', inverse: 'moons'}
        }
      }
    }
  });

  var earth = schema.normalize('planet', {});
  var moon = schema.normalize('moon', {});

  deepEqual(earth.__rel.moons, {}, 'hasMany relationship has been seeded with an empty object');
  strictEqual(moon.__rel.planet, null, 'default has not been set - should be null');
});

test("#normalize will not overwrite data set as attributes", function() {
  var schema = new Schema({
    models: {
      planet: {
        attributes: {
          name: {type: 'string', defaultValue: 'Jupiter'},
          classification: {type: 'string', defaultValue: function() {
            return 'gas giant';
          }}
        },
        links: {
          moons: {type: 'hasMany', model: 'moon', inverse: 'planet'}
        }
      },
      moon: {
        attributes: {
          name: {type: 'string'}
        },
        links: {
          planet: {type: 'hasOne', model: 'planet', inverse: 'moons'}
        }
      }
    }
  });

  var earth = schema.normalize('planet', {name: 'Earth', classification: 'terrestrial'});

  var moon = schema.normalize('moon', {name: '*The Moon*', __rel: {planet: earth[schema.idField]}});

  strictEqual(earth.name, 'Earth', 'name has been specified');
  strictEqual(earth.classification, 'terrestrial', 'classification has been specified');

  deepEqual(earth.__rel.moons, {}, 'hasMany relationship has been seeded with an empty object');
  strictEqual(moon.__rel.planet, earth[schema.idField], 'hasOne relationship was specified in data');

  var io = schema.normalize('moon', {});

  var europa = schema.normalize('moon', {});

  var jupitersMoons = {};
  jupitersMoons[io[schema.idField]] = true;
  jupitersMoons[europa[schema.idField]] = true;

  var jupiter = schema.normalize('planet', {name: 'Jupiter', __rel: {moons: jupitersMoons}});

  deepEqual(jupiter.__rel.moons, jupitersMoons, 'hasMany relationship was specified in data');
});