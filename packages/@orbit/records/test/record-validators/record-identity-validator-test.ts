import { RecordSchema } from '../../src/record-schema';
import { StandardRecordValidators } from '../../src/record-validators/standard-record-validators';
import { buildRecordValidatorFor } from '../../src/record-validators/record-validator-builder';
import { validateRecordIdentity } from '../../src/record-validators/record-identity-validator';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('validateRecordIdentity', function (hooks) {
  const schema = new RecordSchema({
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

  const validatorFor = buildRecordValidatorFor();

  test('will check that `type` and `id` are string', function (assert) {
    assert.strictEqual(
      validateRecordIdentity(
        { type: 'planet', id: '1' },
        { schema, validatorFor }
      ),
      undefined
    );

    // Check invalid types
    [{}, { type: 'planet' }, { id: '' }, { type: 'planet', id: 9 }].forEach(
      (record: any) => {
        assert.deepEqual(
          validateRecordIdentity(record, { schema, validatorFor }),
          [
            {
              validator: StandardRecordValidators.RecordIdentity,
              validation: 'type',
              ref: record,
              description:
                'Record identities must be in the form `{ type, id }`, with string values for both `type` and `id`.'
            }
          ]
        );
      }
    );
  });

  test('will check that `type` is defined in the schema', function (assert) {
    assert.strictEqual(
      validateRecordIdentity(
        { type: 'planet', id: '1' },
        { schema, validatorFor }
      ),
      undefined
    );

    assert.deepEqual(
      validateRecordIdentity(
        { type: 'fake', id: '1' },
        { schema, validatorFor }
      ),
      [
        {
          validator: StandardRecordValidators.RecordType,
          validation: 'recordTypeDefined',
          ref: 'fake',
          description: `Record type 'fake' does not exist in schema`
        }
      ]
    );
  });

  test('skips `type` check if `modelDef` option is passed instead of `schema`', function (assert) {
    const modelDef = schema.getModel('planet');

    assert.strictEqual(
      validateRecordIdentity(
        { type: 'planet', id: '1' },
        { modelDef, validatorFor }
      ),
      undefined
    );

    assert.strictEqual(
      validateRecordIdentity(
        { type: 'fake', id: '1' },
        { modelDef, validatorFor }
      ),
      undefined
    );
  });
});
