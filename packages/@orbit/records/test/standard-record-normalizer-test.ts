import { Orbit } from '@orbit/core';
import { Dict } from '@orbit/utils';
import { UninitializedRecord } from '../src/record';
import { RecordKeyMap } from '../src/record-key-map';
import { ModelDefinition, RecordSchema } from '../src/record-schema';
import { StandardRecordNormalizer } from '../src/standard-record-normalizer';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('StandardRecordNormalizer', function (hooks) {
  let normalizer: StandardRecordNormalizer;
  let keyMap: RecordKeyMap;
  let schema: RecordSchema;
  let models: Dict<ModelDefinition> = {
    planet: {
      keys: {
        remoteId: {}
      },
      attributes: {
        name: { type: 'string' }
      },
      relationships: {
        moons: { kind: 'hasMany', type: 'moon' }
      }
    },
    moon: {
      keys: {
        remoteId: {}
      },
      attributes: {
        name: { type: 'string' }
      },
      relationships: {
        planet: { kind: 'hasOne', type: 'planet' }
      }
    },
    solarSystem: {
      keys: {
        remoteId: {}
      },
      attributes: {
        name: { type: 'string' }
      },
      relationships: {
        objects: { kind: 'hasMany', type: ['planet', 'moon'] },
        largestObject: { kind: 'hasOne', type: ['planet', 'moon'] }
      }
    }
  };

  hooks.beforeEach(function () {
    keyMap = new RecordKeyMap();
    schema = new RecordSchema({
      models
    });
  });

  test('can be instantiated', function (assert) {
    normalizer = new StandardRecordNormalizer({ schema });
    assert.ok(normalizer);
  });

  test('has default settings', function (assert) {
    normalizer = new StandardRecordNormalizer({ schema });
    assert.notOk(normalizer.validateInputs, 'validateInputs defaults to false');
    assert.notOk(normalizer.cloneInputs, 'cloneInputs defaults to false');
  });

  test('#normalizeRecordType will return a string unmodified by default', function (assert) {
    normalizer = new StandardRecordNormalizer({ schema });

    assert.strictEqual(normalizer.normalizeRecordType('moon'), 'moon');
  });

  test('#normalizeRecordType will check that `type` is a string exists in schema in `validateInputs` mode', function (assert) {
    normalizer = new StandardRecordNormalizer({ schema, validateInputs: true });

    assert.strictEqual(normalizer.normalizeRecordType('moon'), 'moon');

    assert.throws(() => {
      normalizer.normalizeRecordType({ type: 'moon' } as any);
    }, new Error(`Assertion failed: StandardRecordNormalizer expects record types to be strings`));

    assert.throws(() => {
      normalizer.normalizeRecordType('FAKE');
    }, new Error(`Schema: Model 'FAKE' not defined.`));
  });

  test('#normalizeRecordIdentity will return a complete record identity unmodified by default', function (assert) {
    normalizer = new StandardRecordNormalizer({ schema });

    const moon = { type: 'moon', id: '234' };
    const result = normalizer.normalizeRecordIdentity(moon);
    assert.strictEqual(result, moon);
  });

  test('#normalizeRecordIdentity will return a clone of a complete record identity in `cloneInputs` mode', function (assert) {
    normalizer = new StandardRecordNormalizer({ schema, cloneInputs: true });

    const moon = { type: 'moon', id: '234' };
    const result = normalizer.normalizeRecordIdentity(moon);
    assert.notStrictEqual(result, moon);
    assert.deepEqual(result, moon);
  });

  test('#normalizeRecordIdentity will check that `type` exists in schema in `validateInputs` mode', function (assert) {
    normalizer = new StandardRecordNormalizer({ schema, validateInputs: true });

    const moon = { type: 'FAKE', id: '234' };

    assert.throws(() => {
      normalizer.normalizeRecordIdentity(moon);
    }, new Error(`Schema: Model 'FAKE' not defined.`));
  });

  test('#normalizeRecordIdentity will NOT check that `type` exists in schema when NOT in `validateInputs` mode', function (assert) {
    normalizer = new StandardRecordNormalizer({
      schema,
      validateInputs: false
    });

    const moon = { type: 'FAKE', id: '234' };
    const result = normalizer.normalizeRecordIdentity(moon);
    assert.strictEqual(result, moon);
  });

  test('#normalizeRecordIdentity will check that identity input is a valid form', function (assert) {
    normalizer = new StandardRecordNormalizer({ schema, keyMap });

    assert.throws(() => {
      normalizer.normalizeRecordIdentity({
        type: 'moon',
        key: 'remoteId'
      } as any);
    }, new Error('Assertion failed: StandardRecordNormalizer expects record identities in the form `{ type: string, id: string }` or `{ type: string, key: string, value: string }`'));
  });

  test('#normalizeRecordIdentity requires a `keyMap` if it is passed a `key` / `value` identity', function (assert) {
    normalizer = new StandardRecordNormalizer({ schema });

    assert.throws(() => {
      normalizer.normalizeRecordIdentity({
        type: 'moon',
        key: 'remoteId',
        value: 'abc'
      });
    }, new Error("Assertion failed: StandardRecordNormalizer's `keyMap` must be specified in order to lookup an `id` from a `key`"));
  });

  test('#normalizeRecordIdentity will check that a `key` is valid for a `type` in `validateInputs` mode', function (assert) {
    normalizer = new StandardRecordNormalizer({
      schema,
      keyMap,
      validateInputs: true
    });

    assert.throws(() => {
      normalizer.normalizeRecordIdentity({
        type: 'moon',
        key: 'FAKE',
        value: 'abc'
      } as any);
    }, new Error("Schema: Key 'FAKE' not defined for model 'moon'."));
  });

  test('#normalizeRecordIdentity will use an id from its keyMap if it can find a matching key/value', function (assert) {
    normalizer = new StandardRecordNormalizer({ schema, keyMap });

    keyMap.pushRecord({ type: 'moon', id: '123', keys: { remoteId: 'abc' } });
    assert.strictEqual(
      keyMap.keyToId('moon', 'remoteId', 'abc'),
      '123',
      'identity is in keymap'
    );
    let moon = { type: 'moon', key: 'remoteId', value: 'abc' };
    let result = normalizer.normalizeRecordIdentity(moon);
    assert.deepEqual(
      result,
      { type: 'moon', id: '123' },
      'uses id from keymap'
    );
  });

  test('#normalizeRecordIdentity will generate an id if it can not find a matching key/value', function (assert) {
    schema = new RecordSchema({
      generateId: (modelName) => `${modelName}-123`,
      models
    });
    normalizer = new StandardRecordNormalizer({ schema, keyMap });

    assert.strictEqual(
      keyMap.keyToId('moon', 'remoteId', 'abc'),
      undefined,
      'identity not in keymap'
    );
    let moon = { type: 'moon', key: 'remoteId', value: 'abc' };
    let result = normalizer.normalizeRecordIdentity(moon);
    assert.deepEqual(
      result,
      { type: 'moon', id: 'moon-123' },
      'generates an ID'
    );
    assert.strictEqual(
      keyMap.keyToId('moon', 'remoteId', 'abc'),
      'moon-123',
      'identity now in keymap'
    );
  });

  test('#normalizeRecord will return a complete record unmodified by default', function (assert) {
    normalizer = new StandardRecordNormalizer({ schema });

    const moon = { type: 'moon', id: '234' };
    const result = normalizer.normalizeRecord(moon);
    assert.strictEqual(result, moon);
  });

  test('#normalizeRecord will return a clone of a complete record identity in `cloneInputs` mode', function (assert) {
    normalizer = new StandardRecordNormalizer({ schema, cloneInputs: true });

    const moon = { type: 'moon', id: '234' };
    const result = normalizer.normalizeRecord(moon);
    assert.notStrictEqual(result, moon);
    assert.deepEqual(result, moon);
  });

  test('#normalizeRecord will check that `type` exists in schema in `validateInputs` mode', function (assert) {
    normalizer = new StandardRecordNormalizer({ schema, validateInputs: true });

    const moon = { type: 'fake', id: '234' };
    assert.throws(() => {
      normalizer.normalizeRecord(moon);
    }, new Error(`Schema: Model 'fake' not defined.`));
  });

  test('#normalizeRecord will NOT validate inputs when NOT in `validateInputs` mode', function (assert) {
    normalizer = new StandardRecordNormalizer({
      schema,
      validateInputs: false
    });

    const moon = {
      type: 'fake',
      id: '234',
      attributes: { nope: 0 },
      relationships: { nada: { data: null } }
    };
    const result = normalizer.normalizeRecord(moon);
    assert.strictEqual(result, moon);
  });

  test('#normalizeRecord attempts to lookup an `id` from `keyMap` if it is undefined', function (assert) {
    normalizer = new StandardRecordNormalizer({ schema, keyMap });

    keyMap.pushRecord({ type: 'moon', id: '123', keys: { remoteId: 'abc' } });
    assert.strictEqual(
      keyMap.keyToId('moon', 'remoteId', 'abc'),
      '123',
      'identity is in keymap'
    );
    let moon = {
      type: 'moon',
      keys: { remoteId: 'abc' },
      attributes: { name: 'Luna' }
    };
    let result = normalizer.normalizeRecord(moon);
    assert.deepEqual(
      result,
      {
        type: 'moon',
        id: '123',
        keys: { remoteId: 'abc' },
        attributes: { name: 'Luna' }
      },
      'uses id from keymap'
    );
  });

  test('#normalizeRecord will check that every `key` is valid for a `type` in `validateInputs` mode', function (assert) {
    normalizer = new StandardRecordNormalizer({
      schema,
      keyMap,
      validateInputs: true
    });

    assert.throws(() => {
      normalizer.normalizeRecord({
        type: 'moon',
        keys: {
          remoteId: 'abc',
          FAKE: 'abc'
        }
      } as any);
    }, new Error("Schema: Key 'FAKE' not defined for model 'moon'."));
  });

  test('#normalizeRecord generates an `id` if it is undefined', function (assert) {
    schema = new RecordSchema({
      generateId: (modelName) => `${modelName}-123`,
      models
    });
    normalizer = new StandardRecordNormalizer({ schema });

    let moon: UninitializedRecord = { type: 'moon' };
    normalizer.normalizeRecord(moon);
    assert.equal(moon.id, 'moon-123', 'generates an `id` if it is undefined');

    moon = { type: 'moon', id: '234' };
    normalizer.normalizeRecord(moon);
    assert.equal(moon.id, '234', 'does not alter an `id` that is already set');
  });
});
