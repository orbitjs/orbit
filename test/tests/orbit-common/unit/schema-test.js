import Schema from 'orbit-common/schema';
import { uuid } from 'orbit/lib/uuid';
import { ModelNotRegisteredException } from 'orbit-common/lib/exceptions';

///////////////////////////////////////////////////////////////////////////////

module('OC - Schema');

test('it exists', function() {
  const schema = new Schema();
  ok(schema);
});

test('it has a `modelDefaults` set by default', function() {
  const schema = new Schema({
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
  const customIdGenerator = function() {
    return Math.random().toString(); // don't do this ;)
  };

  const schema = new Schema({
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

test('#registerModel can register models after initialization', function(assert) {
  const done = assert.async();

  const customIdGenerator = function() {
    return Math.random().toString(); // don't do this ;)
  };

  const schema = new Schema({
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

  assert.ok(schema.models, 'schema.models has been set');
  assert.ok(schema.models['planet'], 'model definition has been set');
  assert.equal(schema.models['moon'], undefined, 'moon\'s definition has NOT been set');

  schema.on('modelRegistered', function(name) {
    if (name === 'moon') {
      let model;
      assert.ok(model = schema.models['moon'], 'model definition has been set');
      assert.strictEqual(model.id.defaultValue, customIdGenerator, 'model.id.defaultValue has been set');
      assert.ok(model.keys, 'model.keys has been set');
      assert.ok(model.attributes, 'model.attributes has been set');
      assert.ok(model.relationships, 'model.relationships has been set');
      assert.ok(model.keys.remoteId, 'model.keys.remoteId has been set');
      assert.equal(Object.keys(model.keys).length, 1, 'model has one key');
      assert.equal(Object.keys(model.attributes).length, 1, 'model has no attributes');
      assert.equal(Object.keys(model.relationships).length, 1, 'model has no relationships');

      done();
    }
  });

  schema.registerModel('moon', {});
});

test('#modelDefinition returns a registered model definition', function(assert) {
  const planetDefinition = {
    attributes: {
      name: { type: 'string', defaultValue: 'Earth' }
    }
  };

  const schema = new Schema({
    models: {
      planet: planetDefinition
    }
  });

  assert.deepEqual(schema.modelDefinition('planet').attributes, planetDefinition.attributes);
});

test('#modelDefinition throws an exception if a model is not registered', function() {
  const schema = new Schema({
    models: {
    }
  });

  throws(function() {
    schema.modelDefinition('planet');
  }, ModelNotRegisteredException, 'threw a OC.ModelNotRegisteredException');
});

test('#modelNotDefined can provide lazy registrations of models', function(assert) {
  assert.expect(2);

  const schema = new Schema({
    models: {
    }
  });

  const planetDefinition = {
    attributes: {
      name: { type: 'string', defaultValue: 'Earth' }
    }
  };

  schema.modelNotDefined = function(type) {
    assert.equal(type, 'planet', 'modelNotDefined called as expected');
    schema.registerModel('planet', planetDefinition);
  };

  assert.deepEqual(
    schema.modelDefinition('planet').attributes,
    planetDefinition.attributes,
    'model registered via modelNotDefined hook'
  );
});

test('#normalize initializes a record with a unique primary key', function() {
  const schema = new Schema({
    models: {
      planet: {}
    }
  });

  const earth = schema.normalize({ type: 'planet' });
  const mars = schema.normalize({ type: 'planet' });

  ok(earth.id, 'id has been set');
  ok(mars.id, 'id has been set');
  notEqual(earth.id, mars.id, 'ids are unique');
});

test('#normalize throws a ModelNotRegisteredException error for missing models', function() {
  const schema = new Schema({
    models: {
      planet: {}
    }
  });

  expect(1);

  throws(function() {
    schema.normalize({ type: 'not-planet' });
  }, ModelNotRegisteredException, 'threw a OC.ModelNotRegisteredException');
});

test('#normalize initializes a record\'s attributes with any defaults that are specified with a value or function', function() {
  const schema = new Schema({
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

  const earth = schema.normalize({ type: 'planet' });

  strictEqual(earth.attributes.name, 'Earth', 'default has been set by value');
  strictEqual(earth.attributes.shape, undefined, 'default has not been set - should be undefined');
  strictEqual(earth.attributes.classification, 'terrestrial', 'default has been set by function');
  strictEqual(earth.attributes.hasWater, false, 'default has not been set - should be false');
});

test('#normalize initializes a record\'s relationships', function() {
  const schema = new Schema({
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

  const earth = schema.normalize({ type: 'planet' });
  const moon = schema.normalize({ type: 'moon' });

  deepEqual(earth.relationships.moons.data, {}, 'default has not been set - should be undefined');
  strictEqual(moon.relationships.planet.data, null, 'default has not been set - should be undefined');
});

test('#normalize will not overwrite data set as attributes', function() {
  const schema = new Schema({
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

  const earth = schema.normalize({ type: 'planet', attributes: { name: 'Earth', classification: 'terrestrial' } });

  const moon = schema.normalize({ type: 'moon', attributes: { name: '*The Moon*' }, relationships: { planet: { data: 'planet:' + earth.id } } });

  strictEqual(earth.attributes.name, 'Earth', 'name has been specified');
  strictEqual(earth.attributes.classification, 'terrestrial', 'classification has been specified');

  deepEqual(earth.relationships.moons.data, {}, 'hasMany relationship was not initialized');
  strictEqual(moon.relationships.planet.data, 'planet:' + earth.id, 'hasOne relationship was specified in data');

  const io = schema.normalize({ type: 'moon' });

  const europa = schema.normalize({ type: 'moon' });

  const jupitersMoons = {};
  jupitersMoons[io.id] = true;
  jupitersMoons[europa.id] = true;

  const jupiter = schema.normalize({
    type: 'planet',
    attributes: { name: 'Jupiter' },
    relationships: { moons: jupitersMoons }
  });

  deepEqual(jupiter.relationships.moons, jupitersMoons, 'hasMany relationship was specified in data');
});

test('#pluralize simply adds an `s` to the end of words', function() {
  const schema = new Schema();
  equal(schema.pluralize('cow'), 'cows', 'no kine here');
});

test('#singularize simply removes a trailing `s` if present at the end of words', function() {
  const schema = new Schema();
  equal(schema.singularize('cows'), 'cow', 'no kine here');
  equal(schema.singularize('data'), 'data', 'no Latin knowledge here');
});

test('#ensureModelTypeInitialized throws an error when a model type has not been registered', function(assert) {
  const schema = new Schema({ models: { moon: {} } });

  // No errors when the model is present
  schema.ensureModelTypeInitialized('moon');

  assert.throws(function() {
    schema.ensureModelTypeInitialized('planet');
  }, ModelNotRegisteredException, 'threw a OC.ModelNotRegisteredException');
});

test('#generateDefaultId', function(assert) {
  const schema = new Schema({
    modelDefaults: {
      id: {
        defaultValue: () => 'generated-id'
      }
    },

    models: {
      moon: {}
    }
  });

  assert.equal(schema.generateDefaultId('moon'), 'generated-id', 'provides the default value for the ID');
});
