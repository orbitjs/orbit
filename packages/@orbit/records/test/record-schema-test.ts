import { Dict } from '@orbit/utils';
import {
  AttributeDefinition,
  KeyDefinition,
  RecordSchema,
  RelationshipDefinition
} from '../src/record-schema';
import { delay } from './support/timing';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('RecordSchema', function () {
  test('can be instantiated', function (assert) {
    const schema = new RecordSchema();
    assert.ok(schema);
  });

  test('#version is assigned `1` by default', function (assert) {
    const schema = new RecordSchema();
    assert.equal(schema.version, 1, 'version === 1');
  });

  test('#upgrade bumps the current version, emits the `upgrade` event, and awaits any listener responses', async function (assert) {
    assert.expect(8);

    const schema = new RecordSchema({
      models: {
        planet: {}
      }
    });
    assert.equal(schema.version, 1, 'version === 1');

    const DELAY = 50;

    schema.on('upgrade', async (version) => {
      assert.equal(version, 2, 'version is passed as argument');
      assert.equal(schema.version, 2, 'version === 2');
      assert.ok(
        schema.getModel('planet').attributes?.name,
        'model attribute has been added'
      );
      await delay(DELAY);
    });

    schema.on('upgrade', async (version) => {
      assert.equal(version, 2, 'version is passed as argument');
      assert.equal(schema.version, 2, 'version === 2');
      assert.ok(
        schema.getModel('planet').attributes?.name,
        'model attribute has been added'
      );
      await delay(DELAY);
    });

    const startTime = new Date().getTime();

    await schema.upgrade({
      models: {
        planet: {
          attributes: {
            name: { type: 'string' }
          }
        }
      }
    });

    const endTime = new Date().getTime();
    const elapsedTime = endTime - startTime;
    assert.ok(
      elapsedTime < 2 * DELAY,
      'upgrade listeners performed in parallel'
    );
  });

  test('#models provides access to model definitions', function (assert) {
    const planetDefinition = {
      attributes: {
        name: { type: 'string' }
      }
    };

    const schema = new RecordSchema({
      models: {
        planet: planetDefinition
      }
    });

    assert.deepEqual(
      schema.models.planet.attributes,
      planetDefinition.attributes
    );
  });

  test('#getModel provides access to a model definition', function (assert) {
    const planetDefinition = {
      attributes: {
        name: { type: 'string' }
      }
    };

    const schema = new RecordSchema({
      models: {
        planet: planetDefinition
      }
    });

    assert.deepEqual(
      schema.getModel('planet').attributes,
      planetDefinition.attributes
    );
  });

  test('#getModel throws an exception if a model definition is not found', function (assert) {
    const schema = new RecordSchema();

    assert.throws(function () {
      schema.getModel('planet');
    }, /Error: Schema: Model 'planet' not defined./);
  });

  test('#hasModel', function (assert) {
    const schema = new RecordSchema({
      models: {
        planet: {
          attributes: {
            name: { type: 'string' }
          }
        }
      }
    });

    assert.equal(schema.hasModel('planet'), true);
    assert.equal(schema.hasModel('unknown'), false);
  });

  test('#getAttribute', function (assert) {
    const schema = new RecordSchema({
      models: {
        planet: {
          attributes: {
            name: { type: 'string' }
          }
        }
      }
    });

    assert.deepEqual(schema.getAttribute('planet', 'name'), { type: 'string' });
  });

  test('#getAttribute throws an exception if a model definition is not found', function (assert) {
    const schema = new RecordSchema();

    assert.throws(function () {
      schema.getAttribute('planet', 'name');
    }, /Error: Schema: Model 'planet' not defined./);
  });

  test('#getAttribute throws an exception if an attribute definition is not found', function (assert) {
    const schema = new RecordSchema({
      models: {
        planet: {
          attributes: {
            name: { type: 'string' }
          }
        }
      }
    });

    assert.throws(function () {
      schema.getAttribute('planet', 'name2');
    }, /Error: Schema: Attribute 'name2' not defined for model 'planet'./);
  });

  test('#eachAttribute', function (assert) {
    const schema = new RecordSchema({
      models: {
        planet: {
          attributes: {
            name: { type: 'string' }
          },
          relationships: {
            moons: { kind: 'hasMany', type: 'moon' }
          }
        },
        moon: {}
      }
    });

    let attributes: Dict<AttributeDefinition> = {};

    schema.eachAttribute('planet', (name, attribute) => {
      attributes[name] = attribute;
    });

    assert.deepEqual(attributes, {
      name: { type: 'string' }
    });
  });

  test('#eachAttribute throws an exception if a model definition is not found', function (assert) {
    const schema = new RecordSchema();

    assert.throws(function () {
      schema.eachAttribute('planet', (name, attribute) => {});
    }, /Error: Schema: Model 'planet' not defined./);
  });

  test('#hasAttribute', function (assert) {
    const schema = new RecordSchema({
      models: {
        planet: {
          attributes: {
            name: { type: 'string' }
          }
        }
      }
    });

    assert.equal(schema.hasAttribute('planet', 'name'), true);
    assert.equal(schema.hasAttribute('planet', 'unknown'), false);
    assert.equal(schema.hasAttribute('fake', 'name'), false);
  });

  test('#getKey', function (assert) {
    const schema = new RecordSchema({
      models: {
        planet: {
          keys: {
            key1: { meta: { description: 'first' } }
          }
        }
      }
    });

    assert.deepEqual(schema.getKey('planet', 'key1'), {
      meta: { description: 'first' }
    });
  });

  test('#getKey throws an exception if a model definition is not found', function (assert) {
    const schema = new RecordSchema();

    assert.throws(function () {
      schema.getKey('planet', 'key1');
    }, /Error: Schema: Model 'planet' not defined./);
  });

  test('#getKey throws an exception if a key definition is not found', function (assert) {
    const schema = new RecordSchema({
      models: {
        planet: {
          keys: {
            key1: { meta: { description: 'first' } }
          }
        }
      }
    });

    assert.throws(function () {
      schema.getKey('planet', 'key2');
    }, /Error: Schema: Key 'key2' not defined for model 'planet'./);
  });

  test('#eachKey', function (assert) {
    const schema = new RecordSchema({
      models: {
        planet: {
          attributes: {
            name: { type: 'string' }
          },
          keys: {
            key1: { meta: { description: 'first' } },
            key2: { meta: { description: 'second' } }
          },
          relationships: {
            moons: { kind: 'hasMany', type: 'moon' }
          }
        },
        moon: {}
      }
    });

    let keys: Dict<KeyDefinition> = {};

    schema.eachKey('planet', (name, key) => {
      keys[name] = key;
    });

    assert.deepEqual(keys, {
      key1: { meta: { description: 'first' } },
      key2: { meta: { description: 'second' } }
    });
  });

  test('#eachKey throws an exception if a model definition is not found', function (assert) {
    const schema = new RecordSchema();

    assert.throws(function () {
      schema.eachKey('planet', (name, key) => {});
    }, /Error: Schema: Model 'planet' not defined./);
  });

  test('#hasKey', function (assert) {
    const schema = new RecordSchema({
      models: {
        planet: {
          keys: {
            key1: { meta: { description: 'first' } },
            key2: { meta: { description: 'second' } }
          }
        }
      }
    });

    assert.equal(schema.hasKey('planet', 'key1'), true);
    assert.equal(schema.hasKey('planet', 'key3'), false);
    assert.equal(schema.hasKey('fake', 'key1'), false);
  });

  test('#getRelationship', function (assert) {
    const schema = new RecordSchema({
      models: {
        planet: {
          relationships: {
            moons: { kind: 'hasMany', type: 'moon' }
          }
        },
        moon: {}
      }
    });

    assert.deepEqual(schema.getRelationship('planet', 'moons'), {
      kind: 'hasMany',
      type: 'moon'
    });
  });

  test('#getRelationship throws an exception if a model definition is not found', function (assert) {
    const schema = new RecordSchema();

    assert.throws(function () {
      schema.getRelationship('planet', 'moons');
    }, /Error: Schema: Model 'planet' not defined./);
  });

  test('#getRelationship throws an exception if a relationship definition is not found', function (assert) {
    const schema = new RecordSchema({
      models: {
        planet: {
          attributes: {
            name: { type: 'string' }
          }
        }
      }
    });

    assert.throws(function () {
      schema.getRelationship('planet', 'moons');
    }, /Error: Schema: Relationship 'moons' not defined for model 'planet'./);
  });

  test('#eachRelationship', function (assert) {
    const schema = new RecordSchema({
      models: {
        planet: {
          attributes: {
            name: { type: 'string' }
          },
          relationships: {
            moons: { kind: 'hasMany', type: 'moon' }
          }
        },
        moon: {}
      }
    });

    let relationships: Dict<RelationshipDefinition> = {};

    schema.eachRelationship('planet', (name, relationship) => {
      relationships[name] = relationship;
    });

    assert.deepEqual(relationships, {
      moons: { kind: 'hasMany', type: 'moon' }
    });
  });

  test('#eachRelationship throws an exception if a model definition is not found', function (assert) {
    const schema = new RecordSchema();

    assert.throws(function () {
      schema.eachRelationship('planet', (name, relationship) => {});
    }, /Error: Schema: Model 'planet' not defined./);
  });

  test('#hasRelationship', function (assert) {
    const schema = new RecordSchema({
      models: {
        planet: {
          relationships: {
            moons: { kind: 'hasMany', type: 'moon' }
          }
        },
        moon: {}
      }
    });

    assert.equal(schema.hasRelationship('planet', 'moons'), true);
    assert.equal(schema.hasRelationship('planet', 'unknown'), false);
    assert.equal(schema.hasRelationship('fake', 'moons'), false);
  });

  test('#pluralize simply adds an `s` to the end of words', function (assert) {
    const schema = new RecordSchema();
    assert.equal(schema.pluralize('cow'), 'cows', 'no kine here');
  });

  test('#singularize simply removes a trailing `s` if present at the end of words', function (assert) {
    const schema = new RecordSchema();
    assert.equal(schema.singularize('cows'), 'cow', 'no kine here');
    assert.equal(schema.singularize('data'), 'data', 'no Latin knowledge here');
  });

  test('#generateId', function (assert) {
    const schema = new RecordSchema({
      generateId: (modelName) => `${modelName}-123`,

      models: {
        moon: {}
      }
    });

    assert.equal(
      schema.generateId('moon'),
      'moon-123',
      'provides the default value for the ID'
    );
  });
});
