import { Dict } from '@orbit/utils';
import {
  RecordKeyMap,
  ModelDefinition,
  InitializedRecord,
  RecordSchema
} from '@orbit/records';
import { JSONAPIResourceIdentitySerializer } from '../../src/serializers/jsonapi-resource-identity-serializer';
import { buildSerializerSettingsFor } from '@orbit/serializers';
import { buildJSONAPISerializerFor } from '../../src/serializers/jsonapi-serializer-builder';
import { JSONAPISerializers } from '../../src/serializers/jsonapi-serializers';

const { module, test } = QUnit;

module('JSONAPIResourceIdentitySerializer', function (hooks) {
  module('Using client-generated IDs', function (hooks) {
    const modelDefinitions: Dict<ModelDefinition> = {
      planet: {
        attributes: {
          name: { type: 'string' },
          classification: { type: 'string' }
        },
        relationships: {
          moons: { kind: 'hasMany', type: 'moon', inverse: 'planet' },
          solarSystem: {
            kind: 'hasOne',
            type: 'solarSystem',
            inverse: 'planets'
          }
        }
      },
      moon: {
        attributes: {
          name: { type: 'string' }
        },
        relationships: {
          planet: { kind: 'hasOne', type: 'planet', inverse: 'moons' }
        }
      },
      solarSystem: {
        attributes: {
          name: { type: 'string' }
        },
        relationships: {
          planets: { kind: 'hasMany', type: 'planet', inverse: 'solarSystem' }
        }
      }
    };

    module('Using standard serializers', function (hooks) {
      let serializer: JSONAPIResourceIdentitySerializer;

      hooks.beforeEach(function () {
        const schema = new RecordSchema({ models: modelDefinitions });
        const serializerFor = buildJSONAPISerializerFor({ schema });
        serializer = new JSONAPIResourceIdentitySerializer({
          schema,
          serializerFor
        });
      });

      test('it exists', function (assert) {
        assert.ok(serializer);
      });

      test('#serialize - can serialize a simple resource identity', function (assert) {
        assert.deepEqual(
          serializer.serialize({
            type: 'planet',
            id: '123'
          }),
          {
            type: 'planet',
            id: '123'
          },
          'serialized identity matches'
        );
      });
    });

    module('Using custom serializers', function (hooks) {
      const modelDefinitions: Dict<ModelDefinition> = {
        person: {},
        solarSystem: {}
      };

      let serializer: JSONAPIResourceIdentitySerializer;

      hooks.beforeEach(function () {
        let schema = new RecordSchema({ models: modelDefinitions });
        const serializerSettingsFor = buildSerializerSettingsFor({
          settingsByType: {
            [JSONAPISerializers.ResourceType]: {
              serializationOptions: { inflectors: ['pluralize', 'dasherize'] }
            }
          }
        });
        const serializerFor = buildJSONAPISerializerFor({
          schema,
          serializerSettingsFor
        });
        serializer = new JSONAPIResourceIdentitySerializer({
          schema,
          serializerFor
        });
      });

      test('#serialize - will use custom inflectors', function (assert) {
        assert.deepEqual(
          serializer.serialize({
            type: 'person',
            id: '123'
          }),
          {
            type: 'persons',
            id: '123'
          },
          'custom inflectors are applied to resource type'
        );

        assert.deepEqual(
          serializer.serialize({
            type: 'solarSystem',
            id: '123'
          }),
          {
            type: 'solar-systems',
            id: '123'
          },
          'custom inflectors are applied to resource type'
        );
      });
    });
  });

  module('Using remote IDs', function (hooks) {
    const modelDefinitions: Dict<ModelDefinition> = {
      planet: {
        keys: {
          remoteId: {}
        },
        attributes: {
          name: { type: 'string' },
          classification: { type: 'string' }
        },
        relationships: {
          moons: { kind: 'hasMany', type: 'moon', inverse: 'planet' },
          solarSystem: {
            kind: 'hasOne',
            type: 'solarSystem',
            inverse: 'planets'
          }
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
          planet: { kind: 'hasOne', type: 'planet', inverse: 'moons' }
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
          planets: { kind: 'hasMany', type: 'planet', inverse: 'solarSystem' }
        }
      }
    };
    let serializer: JSONAPIResourceIdentitySerializer;
    let keyMap: RecordKeyMap;

    hooks.beforeEach(function () {
      keyMap = new RecordKeyMap();
      const schema = new RecordSchema({ models: modelDefinitions });
      const serializerFor = buildJSONAPISerializerFor({ keyMap, schema });
      serializer = new JSONAPIResourceIdentitySerializer({
        keyMap,
        schema,
        serializerFor
      });
    });

    test('it exists', function (assert) {
      assert.ok(serializer);
    });

    test('#serialize - can serialize a resource identity with no matching key', function (assert) {
      assert.deepEqual(
        serializer.serialize({
          type: 'planet',
          id: 'jupiter'
        }),
        {
          type: 'planet'
        },
        'serialized identity matches'
      );
    });

    test('#serialize - can serialize a resource identity with a matching key', function (assert) {
      keyMap.pushRecord({
        type: 'planet',
        id: 'p1',
        keys: { remoteId: 'p1-id' }
      });

      assert.deepEqual(
        serializer.serialize({
          type: 'planet',
          id: 'p1'
        }),
        {
          type: 'planet',
          id: 'p1-id'
        },
        'serialized identity matches'
      );
    });

    test('#serialize - can serialize a resource identity with just a `type` if there is no matching key', function (assert) {
      assert.deepEqual(
        serializer.serialize({
          type: 'planet',
          id: 'p1'
        }),
        {
          type: 'planet'
        },
        'serialized identity matches'
      );
    });

    test('#deserialize - can deserialize a resource identity and include keys in the response', function (assert) {
      let record = serializer.deserialize(
        {
          type: 'planet',
          id: '123'
        },
        {
          includeKeys: true
        }
      );

      assert.deepEqual(
        record,
        {
          id: record.id,
          type: 'planet',
          keys: {
            remoteId: '123'
          }
        },
        'deserialized record matches'
      );
    });

    test('#deserialize - can deserialize a simple resource and associate it with a local record', function (assert) {
      let localRecord = {
        id: '1a2b3c',
        type: 'planet'
      } as InitializedRecord;

      assert.deepEqual(
        serializer.deserialize(
          {
            type: 'planet',
            id: '123'
          },
          {
            primaryRecord: localRecord
          }
        ),
        {
          id: '1a2b3c',
          type: 'planet'
        },
        'deserialized record has the id of the local record'
      );

      assert.deepEqual(
        serializer.deserialize(
          {
            type: 'planet',
            id: '123'
          },
          {
            primaryRecord: localRecord,
            includeKeys: true
          }
        ),
        {
          id: '1a2b3c',
          type: 'planet',
          keys: {
            remoteId: '123'
          }
        },
        'deserialized record has the id of the local record and includes keys'
      );
    });
  });
});
