import { RecordSchema } from '../../src/record-schema';
import { validateRecordType } from '../../src/record-validators/record-type-validator';
import { StandardRecordValidators } from '../../src/record-validators/standard-record-validators';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('validateRecordType', function (hooks) {
  let schema = new RecordSchema({
    models: {
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
    }
  });

  test('will check that `type` is a string', function (assert) {
    assert.strictEqual(validateRecordType('planet', { schema }), undefined);

    assert.deepEqual(validateRecordType([] as any, { schema }), [
      {
        validator: StandardRecordValidators.RecordType,
        validation: 'type',
        ref: [] as any,
        description: 'Record `type` must be a string.'
      }
    ]);
  });

  test('will check that `type` is defined in the schema', function (assert) {
    assert.strictEqual(validateRecordType('planet', { schema }), undefined);

    assert.deepEqual(validateRecordType('fake', { schema }), [
      {
        validator: StandardRecordValidators.RecordType,
        validation: 'recordTypeDefined',
        ref: 'fake',
        description: `Record type 'fake' does not exist in schema`
      }
    ]);
  });
});
