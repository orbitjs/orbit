import Schema from '../src/schema';
import './test-helper';

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

  test('#models provides access to model definitions', function(assert) {
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

    assert.deepEqual(schema.models.planet.attributes, planetDefinition.attributes);
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
