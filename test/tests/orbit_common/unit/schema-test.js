import Orbit from 'orbit/main';
import Schema from 'orbit-common/schema';
import { Promise } from 'rsvp';
import { uuid } from 'orbit/lib/uuid';

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

test("it has a `modelDefaults` set by default", function() {
  var schema = new Schema({
    models: {
      planet: {}
    }
  });
  ok(schema.modelDefaults, 'modelDefaults has been set');
  ok(schema.modelDefaults.attributes, 'modelDefaults.attributes has been set');
  ok(schema.modelDefaults.attributes['__id'], 'modelDefaults.attributes[\'__id\'] has been set');
  equal(schema.modelDefaults.attributes['__id'].type, 'id', 'modelDefaults.idDef.type is has been set');
  equal(schema.modelDefaults.attributes['__id'].remote, 'id', 'modelDefaults.idDef.remote has been set');
  strictEqual(schema.modelDefaults.attributes['__id'].generator, uuid, 'modelDefaults.idDef.generator has been set');

  var model;
  ok(schema.models, 'schema.models has been set');
  ok((model = schema.models['planet']), 'model definition has been set');
  ok(model.attributes, 'model.attributes has been set');
  ok(model.attributes['__id'], 'model.attributes[\'__id\'] has been set');
  equal(model.idField, '__id', 'modelDefaults.idField has been set');
  ok(model.idDef, 'modelDefaults.idDef has been set');
  deepEqual(model.localToRemoteId, {}, 'model.localToRemoteId is set');
  deepEqual(model.remoteToLocalId, {}, 'model.remoteToLocalId is set');
  strictEqual(model.idDef, model.attributes['__id'], 'model.idDef is consistent');
  equal(model.idDef.type, 'id', 'model.idDef.type is has been set');
  equal(model.idDef.remote, 'id', 'model.idDef.remote has been set');
  strictEqual(model.idDef.generator, uuid, 'model.idDef.generator has been set');
});

test("`modelDefaults can be overridden", function() {
  var customIdGenerator = function() {
    return Math.random().toString(); // don't do this ;)
  };

  var schema = new Schema({
    modelDefaults: {
      attributes: {
        'id' : {
          type: 'id',
          remote: '_id',
          generator: customIdGenerator
        },
        'someAttr' : {}
      },
      links: {
        'someLink' : {}
      }
    },
    models: {
      planet: {}
    }
  });

  ok(schema.modelDefaults, 'modelDefaults has been set');
  ok(schema.modelDefaults.attributes, 'modelDefaults.attributes has been set');
  equal(schema.modelDefaults.attributes.hasOwnProperty('_id'), false, '\'__id\' attribute not present');
  ok(schema.modelDefaults.attributes['id'], 'custom id attribute has been set');
  equal(schema.modelDefaults.attributes['id'].type, 'id', 'custom id type is has been set');
  equal(schema.modelDefaults.attributes['id'].remote, '_id', 'custom id remote has been set');
  strictEqual(schema.modelDefaults.attributes['id'].generator, customIdGenerator, 'custom id generator has been set');
  ok(schema.modelDefaults.attributes['someAttr'], 'default model schema attribute has been set');
  ok(schema.modelDefaults.links['someLink'], 'default model link schema has been set');

  var model;
  ok(schema.models, 'schema.models has been set');
  ok((model = schema.models['planet']), 'model definition has been set');
  ok(model.attributes, 'model.attributes has been set');
  ok(model.attributes['id'], 'model.attributes[\'id\'] has been set');
  equal(model.idField, 'id', 'model.idField has been set');
  ok(model.idDef, 'modelDefaults.idDef has been set');
  strictEqual(model.idDef, model.attributes['id'], 'model.idDef is consistent');
  deepEqual(model.localToRemoteId, {}, 'model.localToRemoteId is set');
  deepEqual(model.remoteToLocalId, {}, 'model.remoteToLocalId is set');
  equal(model.idDef.type, 'id', 'model.idDef.type is has been set');
  equal(model.idDef.remote, '_id', 'model.idDef.remote has been set');
  strictEqual(model.idDef.generator, customIdGenerator, 'model.idDef.generator has been set');
  ok(model.attributes['someAttr'], 'model.attributes has been inherited');
  ok(model.links['someLink'], 'model.links has been inherited');
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

test("#normalize - local and remote ids can be mapped", function() {
  var schema = new Schema({
    models: {
      planet: {},
      moon: {}
    }
  });

  schema.normalize('planet', {'__id': 1, 'id': 'a'});
  schema.normalize('planet', {'__id': 2, 'id': 'b'});
  schema.normalize('moon', {'__id': 1, 'id': 'c'});
  schema.normalize('moon', {'__id': 2, 'id': 'a'});

  equal(schema.remoteToLocalId('moon', 'c'), '1');
  equal(schema.remoteToLocalId('planet', 'a'), '1');
  equal(schema.remoteToLocalId('bogus', 'a'), undefined);
  equal(schema.remoteToLocalId('planet', 'bogus'), undefined);

  equal(schema.localToRemoteId('planet', '2'), 'b');
  equal(schema.localToRemoteId('moon', '2'), 'a');
  equal(schema.localToRemoteId('bogus', '2'), undefined);
  equal(schema.localToRemoteId('planet', 'bogus'), undefined);
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

  var moon = schema.normalize('moon', {name: '*The Moon*', __rel: {planet: earth[schema.models.planet.idField]}});

  strictEqual(earth.name, 'Earth', 'name has been specified');
  strictEqual(earth.classification, 'terrestrial', 'classification has been specified');

  deepEqual(earth.__rel.moons, {}, 'hasMany relationship has been seeded with an empty object');
  strictEqual(moon.__rel.planet, earth[schema.models.planet.idField], 'hasOne relationship was specified in data');

  var io = schema.normalize('moon', {});

  var europa = schema.normalize('moon', {});

  var jupitersMoons = {};
  jupitersMoons[io[schema.models.moon.idField]] = true;
  jupitersMoons[europa[schema.models.moon.idField]] = true;

  var jupiter = schema.normalize('planet', {name: 'Jupiter', __rel: {moons: jupitersMoons}});

  deepEqual(jupiter.__rel.moons, jupitersMoons, 'hasMany relationship was specified in data');
});
