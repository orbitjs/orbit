import Schema from '../src/schema';

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
    assert.ok(schema.models, 'schema.models has been set');
    assert.ok(schema.models.planet, 'model definition has been set');
  });

  test('#modelDefaults can be overridden', function(assert) {
    const customIdGenerator = function() {
      return Math.random().toString(); // don't do this ;)
    };

    const schema = new Schema({
      generateId: customIdGenerator,
      modelDefaults: {
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

    assert.strictEqual(schema.generateId, customIdGenerator, 'custom id generator has been set');
    assert.ok(schema.modelDefaults, 'modelDefaults has been set');
    assert.ok(schema.modelDefaults.keys.remoteId, 'custom remoteId key has been set');
    assert.ok(schema.modelDefaults.attributes.someAttr, 'default model schema attribute has been set');
    assert.ok(schema.modelDefaults.relationships.someLink, 'default model link schema has been set');

    assert.ok(schema.models, 'schema.models has been set');
    let model = schema.models.planet;
    assert.ok(model, 'model definition has been set');
    assert.ok(model.keys, 'model.keys has been set');
    assert.ok(model.attributes, 'model.attributes has been set');
    assert.ok(model.relationships, 'model.relationships has been set');
    assert.ok(model.attributes['someAttr'], 'model.attributes match defaults');
    assert.ok(model.relationships['someLink'], 'model.relationships match defaults');

    model = schema.models.moon;
    assert.ok(model, 'model definition has been set');
    assert.ok(model.keys, 'model.keys has been set');
    assert.ok(model.attributes, 'model.attributes has been set');
    assert.ok(model.relationships, 'model.relationships has been set');
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

  test('#pluralize simply adds an `s` to the end of words', function(assert) {
    const schema = new Schema();
    assert.equal(schema.pluralize('cow'), 'cows', 'no kine here');
  });

  test('#singularize simply removes a trailing `s` if present at the end of words', function(assert) {
    const schema = new Schema();
    assert.equal(schema.singularize('cows'), 'cow', 'no kine here');
    assert.equal(schema.singularize('data'), 'data', 'no Latin knowledge here');
  });

  test('#generateId', function(assert) {
    const schema = new Schema({
      generateId: (modelName) => `${modelName}-123`,

      models: {
        moon: {}
      }
    });

    assert.equal(schema.generateId('moon'), 'moon-123', 'provides the default value for the ID');
  });
});
