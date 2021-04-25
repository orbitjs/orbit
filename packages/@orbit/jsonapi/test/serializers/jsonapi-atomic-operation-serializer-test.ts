import { Dict } from '@orbit/utils';
import { RecordKeyMap, ModelDefinition, RecordSchema } from '@orbit/records';
import { JSONAPIAtomicOperationSerializer } from '../../src/serializers/jsonapi-atomic-operation-serializer';
import {
  Serializer,
  buildSerializerClassFor,
  buildSerializerSettingsFor
} from '@orbit/serializers';
import { buildJSONAPISerializerFor } from '../../src/serializers/jsonapi-serializer-builder';
import { JSONAPISerializers } from '../../src/serializers/jsonapi-serializers';

const { module, test } = QUnit;

module('JSONAPIOperationSerializer', function (hooks) {
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
      let serializer: JSONAPIAtomicOperationSerializer;

      hooks.beforeEach(function () {
        const schema = new RecordSchema({ models: modelDefinitions });
        const serializerFor = buildJSONAPISerializerFor({ schema });
        serializer = new JSONAPIAtomicOperationSerializer({
          schema,
          serializerFor
        });
      });

      test('it exists', function (assert) {
        assert.ok(serializer);
      });

      test('#serialize - addRecord', function (assert) {
        const operation = serializer.serialize({
          op: 'addRecord',
          record: {
            id: '3',
            type: 'moon',
            attributes: {
              name: 'Io'
            }
          }
        });

        assert.deepEqual(operation, {
          op: 'add',
          ref: {
            id: '3',
            type: 'moon'
          },
          data: {
            id: '3',
            type: 'moon',
            attributes: {
              name: 'Io'
            }
          }
        });
      });

      test('#serialize - updateRecord', function (assert) {
        const operation = serializer.serialize({
          op: 'updateRecord',
          record: {
            id: '1',
            type: 'planet',
            attributes: {
              name: 'Earth'
            }
          }
        });

        assert.deepEqual(operation, {
          op: 'update',
          ref: {
            id: '1',
            type: 'planet'
          },
          data: {
            id: '1',
            type: 'planet',
            attributes: {
              name: 'Earth'
            }
          }
        });
      });

      test('#serialize - replaceRelatedRecord - record', function (assert) {
        const operation = serializer.serialize({
          op: 'replaceRelatedRecord',
          record: {
            id: '1',
            type: 'planet'
          },
          relatedRecord: {
            id: '3',
            type: 'solarSystem'
          },
          relationship: 'solarSystem'
        });

        assert.deepEqual(operation, {
          op: 'update',
          ref: {
            id: '1',
            type: 'planet',
            relationship: 'solarSystem'
          },
          data: {
            id: '3',
            type: 'solarSystem'
          }
        });
      });

      test('#serialize - replaceRelatedRecord - null', function (assert) {
        const operation = serializer.serialize({
          op: 'replaceRelatedRecord',
          record: {
            id: '1',
            type: 'planet'
          },
          relatedRecord: null,
          relationship: 'solarSystem'
        });

        assert.deepEqual(operation, {
          op: 'update',
          ref: {
            id: '1',
            type: 'planet',
            relationship: 'solarSystem'
          },
          data: null
        });
      });

      test('#serialize - replaceRelatedRecords', function (assert) {
        const operation = serializer.serialize({
          op: 'replaceRelatedRecords',
          record: {
            id: '1',
            type: 'planet'
          },
          relatedRecords: [
            {
              id: '2',
              type: 'moon'
            }
          ],
          relationship: 'moons'
        });

        assert.deepEqual(operation, {
          op: 'update',
          ref: {
            id: '1',
            type: 'planet',
            relationship: 'moons'
          },
          data: [
            {
              id: '2',
              type: 'moon'
            }
          ]
        });
      });

      test('#serialize - addToRelatedRecords', function (assert) {
        const operation = serializer.serialize({
          op: 'addToRelatedRecords',
          record: {
            id: '1',
            type: 'planet'
          },
          relatedRecord: {
            id: '2',
            type: 'moon'
          },
          relationship: 'moons'
        });

        assert.deepEqual(operation, {
          op: 'add',
          ref: {
            id: '1',
            type: 'planet',
            relationship: 'moons'
          },
          data: {
            id: '2',
            type: 'moon'
          }
        });
      });

      test('#serialize - removeFromRelatedRecords', function (assert) {
        const operation = serializer.serialize({
          op: 'removeFromRelatedRecords',
          record: {
            id: '1',
            type: 'planet'
          },
          relatedRecord: {
            id: '2',
            type: 'moon'
          },
          relationship: 'moons'
        });

        assert.deepEqual(operation, {
          op: 'remove',
          ref: {
            id: '1',
            type: 'planet',
            relationship: 'moons'
          },
          data: {
            id: '2',
            type: 'moon'
          }
        });
      });

      test('#serialize - remove', function (assert) {
        const operation = serializer.serialize({
          op: 'removeRecord',
          record: {
            id: '1',
            type: 'planet'
          }
        });

        assert.deepEqual(operation, {
          op: 'remove',
          ref: {
            id: '1',
            type: 'planet'
          }
        });
      });

      test('#deserialize - addRecord', function (assert) {
        const operation = serializer.deserialize({
          op: 'add',
          ref: {
            type: 'planet',
            id: '1'
          },
          data: {
            type: 'planet',
            id: '1',
            attributes: {
              name: 'Earth'
            }
          }
        });
        assert.deepEqual(operation, {
          op: 'addRecord',
          record: {
            type: 'planet',
            id: '1',
            attributes: {
              name: 'Earth'
            }
          }
        });
      });

      test('#deserialize - updateRecord', function (assert) {
        const operation = serializer.deserialize({
          op: 'update',
          ref: {
            type: 'planet',
            id: '1'
          },
          data: {
            type: 'planet',
            id: '1',
            attributes: {
              name: 'Earth'
            }
          }
        });
        assert.deepEqual(operation, {
          op: 'updateRecord',
          record: {
            type: 'planet',
            id: '1',
            attributes: {
              name: 'Earth'
            }
          }
        });
      });

      test('#deserialize - replaceRelatedRecord - record', function (assert) {
        const operation = serializer.deserialize({
          op: 'update',
          ref: {
            type: 'planet',
            id: '1',
            relationship: 'solarSystem'
          },
          data: {
            id: '3',
            type: 'solarSystem'
          }
        });
        assert.deepEqual(operation, {
          op: 'replaceRelatedRecord',
          record: {
            id: '1',
            type: 'planet'
          },
          relationship: 'solarSystem',
          relatedRecord: {
            id: '3',
            type: 'solarSystem'
          }
        });
      });

      test('#deserialize - replaceRelatedRecord - null', function (assert) {
        const operation = serializer.deserialize({
          op: 'update',
          ref: {
            type: 'planet',
            id: '1',
            relationship: 'solarSystem'
          },
          data: null
        });
        assert.deepEqual(operation, {
          op: 'replaceRelatedRecord',
          record: {
            id: '1',
            type: 'planet'
          },
          relationship: 'solarSystem',
          relatedRecord: null
        });
      });

      test('#deserialize - replaceRelatedRecords', function (assert) {
        const operation = serializer.deserialize({
          op: 'update',
          ref: {
            id: '1',
            type: 'planet',
            relationship: 'moons'
          },
          data: [
            {
              id: '2',
              type: 'moon'
            }
          ]
        });
        assert.deepEqual(operation, {
          op: 'replaceRelatedRecords',
          record: {
            id: '1',
            type: 'planet'
          },
          relationship: 'moons',
          relatedRecords: [
            {
              id: '2',
              type: 'moon'
            }
          ]
        });
      });

      test('#deserialize - addToRelatedRecords', function (assert) {
        const operation = serializer.deserialize({
          op: 'add',
          ref: {
            id: '1',
            type: 'planet',
            relationship: 'moons'
          },
          data: {
            id: '2',
            type: 'moon'
          }
        });
        assert.deepEqual(operation, {
          op: 'addToRelatedRecords',
          record: {
            id: '1',
            type: 'planet'
          },
          relationship: 'moons',
          relatedRecord: {
            id: '2',
            type: 'moon'
          }
        });
      });

      test('#deserialize - removeFromRelatedRecords', function (assert) {
        const operation = serializer.deserialize({
          op: 'remove',
          ref: {
            id: '1',
            type: 'planet',
            relationship: 'moons'
          },
          data: {
            id: '2',
            type: 'moon'
          }
        });
        assert.deepEqual(operation, {
          op: 'removeFromRelatedRecords',
          record: {
            id: '1',
            type: 'planet'
          },
          relationship: 'moons',
          relatedRecord: {
            id: '2',
            type: 'moon'
          }
        });
      });

      test('#deserialize - remove', function (assert) {
        const operation = serializer.deserialize({
          op: 'remove',
          ref: {
            id: '1',
            type: 'planet'
          }
        });
        assert.deepEqual(operation, {
          op: 'removeRecord',
          record: {
            id: '1',
            type: 'planet'
          }
        });
      });

      test('deserialize - throws on get', function (assert) {
        assert.throws(() => {
          serializer.deserialize({
            op: 'get',
            ref: {
              type: 'planet',
              id: '1'
            }
          });
        }, '"get" operation recieved');
      });
    });

    module('Using custom serializers', function (hooks) {
      const modelDefinitions: Dict<ModelDefinition> = {
        person: {
          attributes: {
            name: { type: 'string' },
            birthday: { type: 'date' },
            birthtime: { type: 'datetime' },
            height: {
              type: 'distance',
              serialization: { format: 'cm', digits: 2 },
              deserialization: { format: 'cm' }
            },
            isAdult: { type: 'boolean' }
          }
        }
      };

      class DistanceSerializer implements Serializer<number, string, any, any> {
        serialize(arg: number, options?: any): string {
          let distance = arg;
          const format = options && options.format;
          const digits = (options && options.digits) || 0;
          if (format === 'cm') {
            distance *= 100;
          } else if (format) {
            throw new Error('Unknown format');
          }
          return distance.toFixed(digits);
        }

        deserialize(arg: string, options?: any): number {
          const format = options && options.format;
          let distance = parseFloat(arg);
          if (format === 'cm') {
            distance /= 100;
          } else if (format) {
            throw new Error('Unknown format');
          }
          return distance;
        }
      }

      let serializer: JSONAPIAtomicOperationSerializer;

      hooks.beforeEach(function () {
        let schema = new RecordSchema({ models: modelDefinitions });
        const serializerClassFor = buildSerializerClassFor({
          distance: DistanceSerializer
        });
        const serializerSettingsFor = buildSerializerSettingsFor({
          settingsByType: {
            [JSONAPISerializers.ResourceField]: {
              serializationOptions: { inflectors: ['dasherize'] }
            },
            [JSONAPISerializers.ResourceType]: {
              serializationOptions: { inflectors: ['pluralize', 'dasherize'] }
            }
          }
        });
        const serializerFor = buildJSONAPISerializerFor({
          schema,
          serializerClassFor,
          serializerSettingsFor
        });
        serializer = new JSONAPIAtomicOperationSerializer({
          schema,
          serializerFor
        });
      });

      test('serializer is assigned some standard serializers by default, and any custom serializers passed as settings', function (assert) {
        // default serializers
        assert.ok(serializer.serializerFor('boolean'));
        assert.ok(serializer.serializerFor('string'));
        assert.ok(serializer.serializerFor('date'));
        assert.ok(serializer.serializerFor('datetime'));
        assert.ok(serializer.serializerFor('number'));

        // custom serializer
        assert.ok(serializer.serializerFor('distance'));

        // nonexistent serializer (as sanity check)
        assert.notOk(serializer.serializerFor('fake'));
      });

      test('#serialize - addRecord - will use available serializers for attribute values', function (assert) {
        const operation = serializer.serialize({
          op: 'addRecord',
          record: {
            type: 'person',
            id: '123',
            attributes: {
              name: 'Joe',
              birthday: new Date(2000, 11, 31),
              birthtime: new Date('2000-12-31T10:00:00.000Z'),
              height: 1.0, // meters
              isAdult: true
            }
          }
        });

        assert.deepEqual(operation, {
          op: 'add',
          ref: {
            id: '123',
            type: 'persons'
          },
          data: {
            id: '123',
            type: 'persons',
            attributes: {
              name: 'Joe',
              birthday: '2000-12-31',
              birthtime: '2000-12-31T10:00:00.000Z',
              height: '100.00', // cm (with 2 digits)
              'is-adult': true
            }
          }
        });
      });

      test('#deserialize - addRecord - will use available serializers for attribute values', function (assert) {
        let result = serializer.deserialize({
          op: 'add',
          ref: {
            id: '123',
            type: 'persons'
          },
          data: {
            id: '123',
            type: 'persons',
            attributes: {
              name: 'Joe',
              birthday: '2000-12-31',
              birthtime: '2000-12-31T10:00:00.000Z',
              height: '100.00', // cm (with 2 digits)
              'is-adult': true
            }
          }
        });
        assert.deepEqual(result, {
          op: 'addRecord',
          record: {
            id: '123',
            type: 'person',
            attributes: {
              name: 'Joe',
              birthday: new Date(2000, 11, 31),
              birthtime: new Date('2000-12-31T10:00:00.000Z'),
              height: 1.0, // meters
              isAdult: true
            }
          }
        });
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
    let serializer: JSONAPIAtomicOperationSerializer;
    let keyMap: RecordKeyMap;

    hooks.beforeEach(function () {
      keyMap = new RecordKeyMap();
      const schema = new RecordSchema({ models: modelDefinitions });
      const serializerFor = buildJSONAPISerializerFor({ keyMap, schema });
      serializer = new JSONAPIAtomicOperationSerializer({
        keyMap,
        schema,
        serializerFor
      });
    });

    test('it exists', function (assert) {
      assert.ok(serializer);
    });

    test('#serialize - addRecord - can serialize a resource with attributes and has-many relationships', function (assert) {
      keyMap.pushRecord({
        type: 'moon',
        id: 'm1',
        keys: { remoteId: 'm1-id' }
      });
      keyMap.pushRecord({
        type: 'moon',
        id: 'm2',
        keys: { remoteId: 'm2-id' }
      });

      assert.deepEqual(
        serializer.serialize({
          op: 'addRecord',
          record: {
            type: 'planet',
            id: 'p1',
            attributes: {
              name: 'Jupiter',
              classification: 'gas giant'
            },
            relationships: {
              moons: {
                data: [
                  { type: 'moon', id: 'm1' },
                  { type: 'moon', id: 'm2' }
                ]
              }
            }
          }
        }),
        {
          op: 'add',
          ref: {
            type: 'planet'
          },
          data: {
            type: 'planet',
            attributes: {
              name: 'Jupiter',
              classification: 'gas giant'
            },
            relationships: {
              moons: {
                data: [
                  { type: 'moon', id: 'm1-id' },
                  { type: 'moon', id: 'm2-id' }
                ]
              }
            }
          }
        },
        'serialized document matches'
      );
    });

    test('#serialize - updateRecord - can serialize a resource with attributes and has-many relationships', function (assert) {
      keyMap.pushRecord({
        type: 'planet',
        id: 'p1',
        keys: { remoteId: 'p1-id' }
      });
      keyMap.pushRecord({
        type: 'moon',
        id: 'm1',
        keys: { remoteId: 'm1-id' }
      });
      keyMap.pushRecord({
        type: 'moon',
        id: 'm2',
        keys: { remoteId: 'm2-id' }
      });

      assert.deepEqual(
        serializer.serialize({
          op: 'updateRecord',
          record: {
            type: 'planet',
            id: 'p1',
            attributes: {
              name: 'Jupiter',
              classification: 'gas giant'
            },
            relationships: {
              moons: {
                data: [
                  { type: 'moon', id: 'm1' },
                  { type: 'moon', id: 'm2' }
                ]
              }
            }
          }
        }),
        {
          op: 'update',
          ref: {
            type: 'planet',
            id: 'p1-id'
          },
          data: {
            type: 'planet',
            id: 'p1-id',
            attributes: {
              name: 'Jupiter',
              classification: 'gas giant'
            },
            relationships: {
              moons: {
                data: [
                  { type: 'moon', id: 'm1-id' },
                  { type: 'moon', id: 'm2-id' }
                ]
              }
            }
          }
        },
        'serialized document matches'
      );
    });

    test('#deserialize - addRecord', function (assert) {
      const operation = serializer.deserialize({
        op: 'add',
        ref: {
          type: 'planet',
          id: '1'
        },
        data: {
          type: 'planet',
          id: '1',
          attributes: {
            name: 'Earth'
          }
        }
      });
      assert.deepEqual(operation, {
        op: 'addRecord',
        record: {
          type: 'planet',
          id: operation.record.id,
          attributes: {
            name: 'Earth'
          },
          keys: {
            remoteId: '1'
          }
        }
      });
    });

    test('#deserialize - updateRecord', function (assert) {
      keyMap.pushRecord({
        type: 'planet',
        id: 'local1',
        keys: { remoteId: '1' }
      });

      const operation = serializer.deserialize({
        op: 'update',
        ref: {
          type: 'planet',
          id: '1'
        },
        data: {
          type: 'planet',
          id: '1',
          attributes: {
            name: 'Earth'
          }
        }
      });
      assert.deepEqual(operation, {
        op: 'updateRecord',
        record: {
          type: 'planet',
          id: 'local1',
          attributes: {
            name: 'Earth'
          },
          keys: {
            remoteId: '1'
          }
        }
      });
    });
  });
});
