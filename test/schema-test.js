import Schema from '../src/schema';
import { uuid } from '../src/utils/uuid';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('Schema', function() {
  test('can be instantiated', function(assert) {
    const schema = new Schema();
    assert.ok(schema);
  });

  test('#version is assigned `1` by default', function(assert) {
    const schema = new Schema();
    assert.equal(schema.version, 1, 'version === 1');
  });

  test('#upgrade bumps the current version', function(assert) {
    const done = assert.async();

    const schema = new Schema({
      models: {
        planet: {}
      }
    });
    assert.equal(schema.version, 1, 'version === 1');

    schema.on('upgrade', (version) => {
      assert.equal(version, 2, 'version is passed as argument');
      assert.equal(schema.version, 2, 'version === 2');
      assert.ok(schema.models.planet.attributes.name, 'model attribute has been added');
      done();
    });

    schema.upgrade({
      models: {
        planet: {
          attributes: {
            name: { type: 'string' }
          }
        }
      }
    });
  });

  test('#modelDefaults is assigned by default', function(assert) {
    const schema = new Schema({
      models: {
        planet: {}
      }
    });

    assert.ok(schema.modelDefaults, 'modelDefaults has been set');
    assert.ok(schema.modelDefaults.id, 'modelDefaults.id has been set');
    assert.strictEqual(schema.modelDefaults.id.defaultValue, uuid, 'modelDefaults.id.defaultValue has been set');

    assert.ok(schema.models, 'schema.models has been set');

    const model = schema.models.planet;
    assert.ok(model, 'model definition has been set');
    assert.ok(model.id, 'model.id has been set');
    assert.strictEqual(model.id.defaultValue, uuid, 'model.id.defaultValue has been set');
  });

  test('#modelDefaults can be overridden', function(assert) {
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

    assert.ok(schema.modelDefaults, 'modelDefaults has been set');
    assert.ok(schema.modelDefaults.id, 'modelDefaults.id has been set');
    assert.strictEqual(schema.modelDefaults.id.defaultValue, customIdGenerator, 'custom id generator has been set');
    assert.ok(schema.modelDefaults.keys.remoteId, 'custom remoteId key has been set');
    assert.ok(schema.modelDefaults.attributes.someAttr, 'default model schema attribute has been set');
    assert.ok(schema.modelDefaults.relationships.someLink, 'default model link schema has been set');

    assert.ok(schema.models, 'schema.models has been set');
    let model = schema.models.planet;
    assert.ok(model, 'model definition has been set');
    assert.ok(model.id, 'model.id has been set');
    assert.ok(model.keys, 'model.keys has been set');
    assert.ok(model.attributes, 'model.attributes has been set');
    assert.ok(model.relationships, 'model.relationships has been set');
    assert.strictEqual(model.id.defaultValue, customIdGenerator, 'model.id.defaultValue has been set');
    assert.ok(model.attributes['someAttr'], 'model.attributes match defaults');
    assert.ok(model.relationships['someLink'], 'model.relationships match defaults');

    model = schema.models.moon;
    assert.ok(model, 'model definition has been set');
    assert.ok(model.id, 'model.id has been set');
    assert.ok(model.keys, 'model.keys has been set');
    assert.ok(model.attributes, 'model.attributes has been set');
    assert.ok(model.relationships, 'model.relationships has been set');
    assert.strictEqual(model.id.defaultValue, customIdGenerator, 'model.id.defaultValue has been set');
    assert.equal(Object.keys(model.keys).length, 0, 'model has no keys');
    assert.equal(Object.keys(model.attributes).length, 0, 'model has no attributes');
    assert.equal(Object.keys(model.relationships).length, 0, 'model has no relationships');
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

  test('#normalize initializes a record with a unique primary key', function(assert) {
    const schema = new Schema({
      models: {
        planet: {}
      }
    });

    const earth = schema.normalize({ type: 'planet' });
    const mars = schema.normalize({ type: 'planet' });

    assert.ok(earth.id, 'id has been set');
    assert.ok(mars.id, 'id has been set');
    assert.notEqual(earth.id, mars.id, 'ids are unique');
  });

  test('#normalize initializes a record\'s attributes with any defaults that are specified with a value or function', function(assert) {
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

    assert.strictEqual(earth.attributes.name, 'Earth', 'default has been set by value');
    assert.strictEqual(earth.attributes.shape, undefined, 'default has not been set - should be undefined');
    assert.strictEqual(earth.attributes.classification, 'terrestrial', 'default has been set by function');
    assert.strictEqual(earth.attributes.hasWater, false, 'default has not been set - should be false');
  });

  test('#normalize initializes a record\'s relationships', function(assert) {
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

    assert.deepEqual(earth.relationships.moons.data, {}, 'default has not been set - should be undefined');
    assert.strictEqual(moon.relationships.planet.data, null, 'default has not been set - should be undefined');
  });

  test('#normalize will not overwrite data set as attributes', function(assert) {
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

    assert.strictEqual(earth.attributes.name, 'Earth', 'name has been specified');
    assert.strictEqual(earth.attributes.classification, 'terrestrial', 'classification has been specified');

    assert.deepEqual(earth.relationships.moons.data, {}, 'hasMany relationship was not initialized');
    assert.strictEqual(moon.relationships.planet.data, 'planet:' + earth.id, 'hasOne relationship was specified in data');

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

    assert.deepEqual(jupiter.relationships.moons, jupitersMoons, 'hasMany relationship was specified in data');
  });

  test('#pluralize simply adds an `s` to the end of words', function(assert) {
    const schema = new Schema();
    assert.equal(schema.pluralize('cow'), 'cows', 'no kine here');
  });

  test('#singularize simply removes a trailing `s` if present at the end of words', function(assert) {
    const schema = new Schema();
    assert.equal(schema.singularize('cows'), 'cow', 'no kine here');
    assert.equal(schema.singularize('data'), 'data', 'no Latin knowledge here');
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
});
