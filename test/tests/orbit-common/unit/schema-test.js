import Orbit from 'orbit/main';
import Schema from 'orbit-common/schema';
import { Promise } from 'rsvp';
import { uuid } from 'orbit/lib/uuid';
import { ModelNotRegisteredException } from 'orbit-common/lib/exceptions';

///////////////////////////////////////////////////////////////////////////////

module('OC - Schema');

test('it exists', function() {
  var schema = new Schema();
  ok(schema);
});

test('it has a `modelDefaults` set by default', function() {
  var schema = new Schema({
    models: {
      planet: {}
    }
  });

  ok(schema.modelDefaults, 'modelDefaults has been set');
  ok(schema.modelDefaults.id, 'modelDefaults.id has been set');
  strictEqual(schema.modelDefaults.id.defaultValue, uuid, 'modelDefaults.id.defaultValue has been set');

  ok(schema.models, 'schema.models has been set');
  const model = schema.models.planet;
  ok(model, 'model definition has been set');
  ok(model.id, 'model.id has been set');
  strictEqual(model.id.defaultValue, uuid, 'model.id.defaultValue has been set');
});

test('`modelDefaults` can be overridden', function() {
  var customIdGenerator = function() {
    return Math.random().toString(); // don't do this ;)
  };

  var schema = new Schema({
    modelDefaults: {
      id: {
        defaultValue: customIdGenerator
      },
      keys: {
        remoteId: {}
      },
      attributes: {
        someAttr: {}
      },
      relationships: {
        someLink: {}
      }
    },
    models: {
      planet: {},
      moon: {
        keys: {
          remoteId: undefined
        },
        attributes: {
          someAttr: undefined
        },
        relationships: {
          someLink: undefined
        }
      }
    }
  });

  ok(schema.modelDefaults, 'modelDefaults has been set');
  ok(schema.modelDefaults.id, 'modelDefaults.id has been set');
  strictEqual(schema.modelDefaults.id.defaultValue, customIdGenerator, 'custom id generator has been set');
  ok(schema.modelDefaults.keys.remoteId, 'custom remoteId key has been set');
  ok(schema.modelDefaults.attributes.someAttr, 'default model schema attribute has been set');
  ok(schema.modelDefaults.relationships.someLink, 'default model link schema has been set');

  let model;
  ok(schema.models, 'schema.models has been set');
  model = schema.models.planet;
  ok(model, 'model definition has been set');
  ok(model.id, 'model.id has been set');
  ok(model.keys, 'model.keys has been set');
  ok(model.attributes, 'model.attributes has been set');
  ok(model.relationships, 'model.relationships has been set');
  strictEqual(model.id.defaultValue, customIdGenerator, 'model.id.defaultValue has been set');
  ok(model.attributes['someAttr'], 'model.attributes match defaults');
  ok(model.relationships['someLink'], 'model.relationships match defaults');

  model = schema.models.moon;
  ok(model, 'model definition has been set');
  ok(model.id, 'model.id has been set');
  ok(model.keys, 'model.keys has been set');
  ok(model.attributes, 'model.attributes has been set');
  ok(model.relationships, 'model.relationships has been set');
  strictEqual(model.id.defaultValue, customIdGenerator, 'model.id.defaultValue has been set');
  equal(Object.keys(model.keys).length, 0, 'model has no keys');
  equal(Object.keys(model.attributes).length, 0, 'model has no attributes');
  equal(Object.keys(model.relationships).length, 0, 'model has no relationships');
});

test('#registerModel can register models after initialization', function() {
  var customIdGenerator = function() {
    return Math.random().toString(); // don't do this ;)
  };

  var schema = new Schema({
    modelDefaults: {
      id: {
        defaultValue: customIdGenerator
      },
      keys: {
        remoteId: {}
      },
      attributes: {
        someAttr: {}
      },
      relationships: {
        someLink: {}
      }
    },
    models: {
      planet: {}
    }
  });

  ok(schema.models, 'schema.models has been set');
  ok(schema.models['planet'], 'model definition has been set');
  equal(schema.models['moon'], undefined, 'moon\'s definition has NOT been set');

  schema.on('modelRegistered', function(name) {
    if (name = 'moon') {
      start();

      var model;
      ok(model = schema.models['moon'], 'model definition has been set');
      strictEqual(model.id.defaultValue, customIdGenerator, 'model.id.defaultValue has been set');
      ok(model.keys, 'model.keys has been set');
      ok(model.attributes, 'model.attributes has been set');
      ok(model.relationships, 'model.relationships has been set');
      ok(model.keys.remoteId, 'model.keys.remoteId has been set');
      equal(Object.keys(model.keys).length, 1, 'model has one key');
      equal(Object.keys(model.attributes).length, 1, 'model has no attributes');
      equal(Object.keys(model.relationships).length, 1, 'model has no relationships');
    }
  });

  stop();
  schema.registerModel('moon', {});
});

test('#modelDefinition returns a registered model definition', function() {
  var planetDefinition = {
    attributes: {
      name: { type: 'string', defaultValue: 'Earth' }
    }
  };

  var schema = new Schema({
    models: {
      planet: planetDefinition
    }
  });

  deepEqual(schema.modelDefinition('planet').attributes, planetDefinition.attributes);
});

test('#modelDefinition throws an exception if a model is not registered', function() {
  var schema = new Schema({
    models: {
    }
  });

  throws(function() {
    schema.modelDefinition('planet');
  }, ModelNotRegisteredException, 'threw a OC.ModelNotRegisteredException');
});

test('#modelNotDefined can provide lazy registrations of models', function(assert) {
  assert.expect(2);

  var schema = new Schema({
    models: {
    }
  });

  var planetDefinition = {
    attributes: {
      name: { type: 'string', defaultValue: 'Earth' }
    }
  };

  schema.modelNotDefined = function(type) {
    assert.equal(type, 'planet', 'modelNotDefined called as expected');
    schema.registerModel('planet', planetDefinition);
  };

  assert.deepEqual(schema.modelDefinition('planet').attributes, planetDefinition.attributes);
});

test('#normalize initializes a record with a unique primary key', function() {
  var schema = new Schema({
    models: {
      planet: {}
    }
  });

  var earth = schema.normalize({ type: 'planet' });
  var mars = schema.normalize({ type: 'planet' });

  ok(earth.id, 'id has been set');
  ok(mars.id, 'id has been set');
  notEqual(earth.id, mars.id, 'ids are unique');
});

test('#normalize throws a ModelNotRegisteredException error for missing models', function() {
  var schema = new Schema({
    models: {
      planet: {}
    }
  });

  expect(1);

  throws(function() {
    var earth = schema.normalize({ type: 'not-planet' });
  }, ModelNotRegisteredException, 'threw a OC.ModelNotRegisteredException');
});

test('#normalize - local and remote ids can be mapped', function() {
  var schema = new Schema({
    modelDefaults: {
      id: { defaultValue: uuid },
      keys: {
        remoteId: {}
      }
    },
    models: {
      planet: {},
      moon: {}
    }
  });

  schema.normalize({ type: 'planet', id: '1', keys: { remoteId: 'a' } });
  schema.normalize({ type: 'planet', id: '2', keys: { remoteId: 'b' } });
  schema.normalize({ type: 'moon', id: '1', keys: { remoteId: 'c' } });
  schema.normalize({ type: 'moon', id: '2', keys: { remoteId: 'a' } });

  equal(schema.keyToId('moon', 'remoteId', 'c'), '1');
  equal(schema.keyToId('planet', 'remoteId', 'a'), '1');
  equal(schema.keyToId('planet', 'remoteId', 'bogus'), undefined);
  ok(schema.keyToId('planet', 'remoteId', 'bogus', true), 'keys with a `defaultValue` can be autogenerated');

  equal(schema.idToKey('planet', 'remoteId', '2'), 'b');
  equal(schema.idToKey('moon', 'remoteId', '2'), 'a');
  equal(schema.idToKey('planet', 'remoteId', 'bogus'), undefined);
  equal(schema.idToKey('planet', 'remoteId', 'bogus', true), undefined, 'keys without a `defaultValue` can not be autogenerated');
});

test('#normalize initializes a record\'s attributes with any defaults that are specified with a value or function', function() {
  var schema = new Schema({
    models: {
      planet: {
        attributes: {
          name: { type: 'string', defaultValue: 'Earth' },
          shape: { type: 'string' },
          classification: { type: 'string', defaultValue: function() {
            return 'terrestrial';
          } },
          hasWater: { type: 'boolean', defaultValue: false }
        }
      }
    }
  });

  var earth = schema.normalize({ type: 'planet' });

  strictEqual(earth.attributes.name, 'Earth', 'default has been set by value');
  strictEqual(earth.attributes.shape, undefined, 'default has not been set - should be undefined');
  strictEqual(earth.attributes.classification, 'terrestrial', 'default has been set by function');
  strictEqual(earth.attributes.hasWater, false, 'default has not been set - should be false');
});

test('#normalize initializes a record\'s relationships', function() {
  var schema = new Schema({
    models: {
      planet: {
        relationships: {
          moons: { type: 'hasMany', model: 'moon', inverse: 'planet' }
        }
      },
      moon: {
        relationships: {
          planet: { type: 'hasOne', model: 'planet', inverse: 'moons' }
        }
      }
    }
  });

  var earth = schema.normalize({ type: 'planet' });
  var moon = schema.normalize({ type: 'moon' });

  deepEqual(earth.relationships.moons.data, {}, 'default has not been set - should be undefined');
  strictEqual(moon.relationships.planet.data, null, 'default has not been set - should be undefined');
});

test('#normalize will not overwrite data set as attributes', function() {
  var schema = new Schema({
    models: {
      planet: {
        attributes: {
          name: { type: 'string', defaultValue: 'Jupiter' },
          classification: { type: 'string', defaultValue: function() {
            return 'gas giant';
          } }
        },
        relationships: {
          moons: { type: 'hasMany', model: 'moon', inverse: 'planet' }
        }
      },
      moon: {
        attributes: {
          name: { type: 'string' }
        },
        relationships: {
          planet: { type: 'hasOne', model: 'planet', inverse: 'moons' }
        }
      }
    }
  });

  var earth = schema.normalize({ type: 'planet', attributes: { name: 'Earth', classification: 'terrestrial' } });

  var moon = schema.normalize({ type: 'moon', attributes: { name: '*The Moon*' }, relationships: { planet: { data: 'planet:' + earth.id } } });

  strictEqual(earth.attributes.name, 'Earth', 'name has been specified');
  strictEqual(earth.attributes.classification, 'terrestrial', 'classification has been specified');

  deepEqual(earth.relationships.moons.data, {}, 'hasMany relationship was not initialized');
  strictEqual(moon.relationships.planet.data, 'planet:' + earth.id, 'hasOne relationship was specified in data');

  var io = schema.normalize({ type: 'moon' });

  var europa = schema.normalize({ type: 'moon' });

  var jupitersMoons = {};
  jupitersMoons[io.id] = true;
  jupitersMoons[europa.id] = true;

  var jupiter = schema.normalize({
    type: 'planet',
    attributes: { name: 'Jupiter' },
    relationships: { moons: jupitersMoons }
  });

  deepEqual(jupiter.relationships.moons, jupitersMoons, 'hasMany relationship was specified in data');
});

test('#registerAllKeys - local and remote ids can be mapped from a data document matching this schema', function() {
  var schema = new Schema({
    modelDefaults: {
      id: {
        defaultValue: uuid
      },
      keys: {
        remoteId: {}
      }
    },
    models: {
      planet: {},
      moon: {}
    }
  });

  schema.registerAllKeys({
    planet: {
      '1': { id: '1', keys: { remoteId: 'a' } },
      '2': { id: '2', keys: { remoteId: 'b' } }
    },
    moon: {
      '1': { id: '1', keys: { remoteId: 'c' } },
      '2': { id: '2', keys: { remoteId: 'a' } }
    }
  });

  equal(schema.keyToId('moon', 'remoteId', 'c'), '1');
  equal(schema.keyToId('planet', 'remoteId', 'a'), '1');
  equal(schema.keyToId('planet', 'remoteId', 'bogus'), undefined);
  ok(schema.keyToId('planet', 'remoteId', 'bogus', true), 'keys with a `defaultValue` can be autogenerated');

  equal(schema.idToKey('planet', 'remoteId', '2'), 'b');
  equal(schema.idToKey('moon', 'remoteId', '2'), 'a');
  equal(schema.idToKey('planet', 'remoteId', 'bogus'), undefined);
  equal(schema.idToKey('planet', 'remoteId', 'bogus', true), undefined, 'keys without a `defaultValue` can not be autogenerated');
});

test('#pluralize simply adds an `s` to the end of words', function() {
  var schema = new Schema();
  equal(schema.pluralize('cow'), 'cows', 'no kine here');
});

test('#singularize simply removes a trailing `s` if present at the end of words', function() {
  var schema = new Schema();
  equal(schema.singularize('cows'), 'cow', 'no kine here');
  equal(schema.singularize('data'), 'data', 'no Latin knowledge here');
});

test('#containsModel', function(assert) {
  var schema = new Schema({ models: { moon: {} } });
  assert.ok(schema.containsModel('moon'), 'identifies when schema contains model');
  assert.ok(!schema.containsModel('black-hole'), 'identifies when scheam does not contain model');
});
