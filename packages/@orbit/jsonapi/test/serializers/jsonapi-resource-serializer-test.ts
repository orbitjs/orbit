import { Dict } from '@orbit/utils';
import {
  RecordKeyMap,
  ModelDefinition,
  InitializedRecord,
  RecordSchema
} from '@orbit/records';
import { JSONAPIResourceSerializer } from '../../src/serializers/jsonapi-resource-serializer';
import {
  Serializer,
  buildSerializerClassFor,
  buildSerializerSettingsFor,
  SerializerClass
} from '@orbit/serializers';
import { buildJSONAPISerializerFor } from '../../src/serializers/jsonapi-serializer-builder';
import { JSONAPISerializers } from '../../src/serializers/jsonapi-serializers';

const { module, test } = QUnit;

module('JSONAPIResourceSerializer', function (hooks) {
  module('Using client-generated IDs', function (hooks) {
    const modelDefinitions: Dict<ModelDefinition> = {
      planet: {
        attributes: {
          name: { type: 'string' },
          classification: { type: 'string' },
          mystery: {}, // an example of the 'unknown' type
          object1: { type: 'object' }, // an example of the 'object' type
          array1: { type: 'array' } // an example of the 'array' type
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
      let serializer: JSONAPIResourceSerializer;

      hooks.beforeEach(function () {
        const schema = new RecordSchema({ models: modelDefinitions });
        const serializerFor = buildJSONAPISerializerFor({ schema });
        serializer = new JSONAPIResourceSerializer({ schema, serializerFor });
      });

      test('it exists', function (assert) {
        assert.ok(serializer);
      });

      test('#serialize - can serialize a simple resource with only type and id', function (assert) {
        assert.deepEqual(
          serializer.serialize({
            type: 'planet',
            id: '123'
          }),
          {
            type: 'planet',
            id: '123'
          },
          'serialized resource matches'
        );
      });

      test('#serialize - serializes attributes without a type using the NoopSerializer by default', function (assert) {
        assert.deepEqual(
          serializer.serialize({
            type: 'planet',
            id: '123',
            attributes: {
              mystery: {
                whatDoWeHaveHere: 234
              }
            }
          }),
          {
            type: 'planet',
            id: '123',
            attributes: {
              mystery: {
                whatDoWeHaveHere: 234
              }
            }
          },
          'serialized resource matches'
        );
      });

      test('#serialize - serializes attributes with `object` and `array` types with NoopSerializer by default', function (assert) {
        assert.deepEqual(
          serializer.serialize({
            type: 'planet',
            id: '123',
            attributes: {
              object1: {
                whatDoWeHaveHere: 234
              },
              array1: ['a', 'b', 'c']
            }
          }),
          {
            type: 'planet',
            id: '123',
            attributes: {
              object1: {
                whatDoWeHaveHere: 234
              },
              array1: ['a', 'b', 'c']
            }
          },
          'serialized resource matches'
        );
      });

      test('#serialize - ignores attributes and relationships not defined in the schema', function (assert) {
        assert.deepEqual(
          serializer.serialize({
            type: 'planet',
            id: '123',
            attributes: {
              unknownAttribute: 'gas giant'
            },
            relationships: {
              overlord: {
                data: {
                  type: 'hutt',
                  id: 'jaba'
                }
              }
            }
          }),
          {
            type: 'planet',
            id: '123'
          },
          'serialized resource excludes unknown data'
        );
      });

      test('#deserialize - can deserialize a simple resource with only type and id', function (assert) {
        let record = serializer.deserialize({
          type: 'planet',
          id: '123'
        });

        assert.deepEqual(
          record,
          {
            type: 'planet',
            id: '123'
          },
          'deserialized resource matches'
        );
      });

      test('#deserialize - ignores attributes and relationships not defined in the schema', function (assert) {
        let result = serializer.deserialize({
          id: '12345',
          type: 'planet',
          attributes: {
            name: 'Jupiter',
            unknownAttribute: 'gas giant'
          },
          relationships: {
            moons: { data: [{ type: 'moon', id: '5' }] },
            unknownRelationship: { data: { type: 'solarSystem', id: 'ss1' } }
          }
        });

        assert.deepEqual(result, {
          type: 'planet',
          id: '12345',
          attributes: {
            name: 'Jupiter'
          },
          relationships: {
            moons: {
              data: [{ type: 'moon', id: '5' }]
            }
          }
        });
      });

      test('it deserializes links and meta in records', function (assert) {
        let result = serializer.deserialize({
          id: '12345',
          type: 'planet',
          attributes: {
            name: 'Jupiter',
            classification: 'gas giant'
          },
          links: {
            self: 'https://example.com/api/planets/12345'
          },
          meta: {
            abc: '123',
            def: '456'
          },
          relationships: {
            moons: { data: [{ type: 'moon', id: '5' }] },
            solarSystem: { data: { type: 'solarSystem', id: '6' } }
          }
        });
        assert.deepEqual(result, {
          type: 'planet',
          id: '12345',
          attributes: {
            classification: 'gas giant',
            name: 'Jupiter'
          },
          links: {
            self: 'https://example.com/api/planets/12345'
          },
          meta: {
            abc: '123',
            def: '456'
          },
          relationships: {
            moons: {
              data: [{ type: 'moon', id: '5' }]
            },
            solarSystem: {
              data: { type: 'solarSystem', id: '6' }
            }
          }
        });
      });

      test('it deserializes links and meta in hasOne relationship', function (assert) {
        let result = serializer.deserialize({
          id: '12345',
          type: 'planet',
          attributes: {
            name: 'Jupiter',
            classification: 'gas giant'
          },
          links: {
            self: 'https://example.com/api/planets/12345'
          },
          relationships: {
            moons: { data: [{ type: 'moon', id: '5' }] },
            solarSystem: {
              data: { type: 'solarSystem', id: '6' },
              links: {
                self:
                  'https://example.com/api/planets/12345/relationships/solarsystem',
                related: 'https://example.com/api/planets/12345/solarsystem'
              },
              meta: {
                abc: '123',
                def: '456'
              }
            }
          }
        });
        assert.deepEqual(result, {
          type: 'planet',
          id: '12345',
          attributes: {
            classification: 'gas giant',
            name: 'Jupiter'
          },
          links: {
            self: 'https://example.com/api/planets/12345'
          },
          relationships: {
            moons: {
              data: [{ type: 'moon', id: '5' }]
            },
            solarSystem: {
              data: { type: 'solarSystem', id: '6' },
              links: {
                self:
                  'https://example.com/api/planets/12345/relationships/solarsystem',
                related: 'https://example.com/api/planets/12345/solarsystem'
              },
              meta: {
                abc: '123',
                def: '456'
              }
            }
          }
        });
      });

      test('it deserializes links and meta in hasMany relationship', function (assert) {
        let result = serializer.deserialize({
          id: '12345',
          type: 'planet',
          attributes: {
            name: 'Jupiter',
            classification: 'gas giant'
          },
          links: {
            self: 'https://example.com/api/planets/12345'
          },
          relationships: {
            moons: {
              data: [{ type: 'moon', id: '5' }],
              links: {
                self:
                  'https://example.com/api/planets/12345/relationships/moons',
                related: 'https://example.com/api/planets/12345/moons'
              },
              meta: {
                abc: '123',
                def: '456'
              }
            },
            solarSystem: {
              data: { type: 'solarSystem', id: '6' }
            }
          }
        });
        assert.deepEqual(result, {
          type: 'planet',
          id: '12345',
          attributes: {
            classification: 'gas giant',
            name: 'Jupiter'
          },
          links: {
            self: 'https://example.com/api/planets/12345'
          },
          relationships: {
            moons: {
              data: [{ type: 'moon', id: '5' }],
              links: {
                self:
                  'https://example.com/api/planets/12345/relationships/moons',
                related: 'https://example.com/api/planets/12345/moons'
              },
              meta: {
                abc: '123',
                def: '456'
              }
            },
            solarSystem: {
              data: { type: 'solarSystem', id: '6' }
            }
          }
        });
      });

      test('it deserializes links and meta in hasOne relationship without data', function (assert) {
        let result = serializer.deserialize({
          id: '12345',
          type: 'planet',
          attributes: {
            name: 'Jupiter',
            classification: 'gas giant'
          },
          links: {
            self: 'https://example.com/api/planets/12345'
          },
          relationships: {
            moons: { data: [{ type: 'moon', id: '5' }] },
            solarSystem: {
              links: {
                self:
                  'https://example.com/api/planets/12345/relationships/solarsystem',
                related: 'https://example.com/api/planets/12345/solarsystem'
              },
              meta: {
                abc: '123',
                def: '456'
              }
            }
          }
        });
        assert.deepEqual(result, {
          type: 'planet',
          id: '12345',
          attributes: {
            classification: 'gas giant',
            name: 'Jupiter'
          },
          links: {
            self: 'https://example.com/api/planets/12345'
          },
          relationships: {
            moons: {
              data: [{ type: 'moon', id: '5' }]
            },
            solarSystem: {
              links: {
                self:
                  'https://example.com/api/planets/12345/relationships/solarsystem',
                related: 'https://example.com/api/planets/12345/solarsystem'
              },
              meta: {
                abc: '123',
                def: '456'
              }
            }
          }
        });
      });

      test('it deserializes links in hasMany relationship without data', function (assert) {
        let result = serializer.deserialize({
          id: '12345',
          type: 'planet',
          attributes: {
            name: 'Jupiter',
            classification: 'gas giant'
          },
          links: {
            self: 'https://example.com/api/planets/12345'
          },
          relationships: {
            moons: {
              links: {
                self:
                  'https://example.com/api/planets/12345/relationships/moons',
                related: 'https://example.com/api/planets/12345/moons'
              },
              meta: {
                abc: '123',
                def: '456'
              }
            },
            solarSystem: { data: { type: 'solarSystem', id: '6' } }
          }
        });
        assert.deepEqual(result, {
          type: 'planet',
          id: '12345',
          attributes: {
            classification: 'gas giant',
            name: 'Jupiter'
          },
          links: {
            self: 'https://example.com/api/planets/12345'
          },
          relationships: {
            moons: {
              links: {
                self:
                  'https://example.com/api/planets/12345/relationships/moons',
                related: 'https://example.com/api/planets/12345/moons'
              },
              meta: {
                abc: '123',
                def: '456'
              }
            },
            solarSystem: {
              data: { type: 'solarSystem', id: '6' }
            }
          }
        });
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
            isAdult: { type: 'boolean' },
            mystery: {}
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

      interface SerializedMystery {
        whatDoWeHaveHere: unknown;
      }

      class MysterySerializer
        implements Serializer<unknown, SerializedMystery> {
        serialize(arg: unknown): SerializedMystery {
          return {
            whatDoWeHaveHere: arg
          };
        }

        deserialize(arg: SerializedMystery): unknown {
          return arg.whatDoWeHaveHere;
        }
      }

      let serializer: JSONAPIResourceSerializer;

      hooks.beforeEach(function () {
        let schema = new RecordSchema({ models: modelDefinitions });
        const serializerClassFor = buildSerializerClassFor({
          distance: DistanceSerializer,
          unknown: MysterySerializer as SerializerClass
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
        serializer = new JSONAPIResourceSerializer({ schema, serializerFor });
      });

      test('serializer is assigned some standard serializers by default, and any custom serializers passed as settings', function (assert) {
        // default serializers
        assert.ok(serializer.serializerFor('boolean'));
        assert.ok(serializer.serializerFor('string'));
        assert.ok(serializer.serializerFor('date'));
        assert.ok(serializer.serializerFor('datetime'));
        assert.ok(serializer.serializerFor('number'));

        // custom serializers
        assert.ok(serializer.serializerFor('distance'));
        assert.ok(serializer.serializerFor('unknown'));

        // nonexistent serializer (as sanity check)
        assert.notOk(serializer.serializerFor('fake'));
      });

      test('#serialize will use available serializers for attribute values', function (assert) {
        assert.deepEqual(
          serializer.serialize({
            type: 'person',
            id: '123',
            attributes: {
              name: 'Joe',
              birthday: new Date(2000, 11, 31),
              birthtime: new Date('2000-12-31T10:00:00.000Z'),
              height: 1.0, // meters
              isAdult: true,
              mystery: {
                foo: 'bar'
              }
            }
          }),
          {
            type: 'persons',
            id: '123',
            attributes: {
              name: 'Joe',
              birthday: '2000-12-31',
              birthtime: '2000-12-31T10:00:00.000Z',
              height: '100.00', // cm (with 2 digits)
              'is-adult': true,
              mystery: {
                whatDoWeHaveHere: {
                  foo: 'bar'
                }
              }
            }
          },
          'serialized resource matches'
        );
      });

      test('#serialize will pass null values without throwing', function (assert) {
        assert.deepEqual(
          serializer.serialize({
            type: 'person',
            id: '123',
            attributes: {
              name: null,
              birthday: null,
              birthtime: null,
              height: null, // meters
              isAdult: null
            }
          }),
          {
            type: 'persons',
            id: '123',
            attributes: {
              name: null,
              birthday: null,
              birthtime: null,
              height: null, // cm (with 2 digits)
              'is-adult': null
            }
          },
          'serialized resource matches'
        );
      });

      test('#deserialize will use available serializers for attribute values', function (assert) {
        let result = serializer.deserialize({
          type: 'persons',
          id: '123',
          attributes: {
            name: 'Joe',
            birthday: '2000-12-31',
            birthtime: '2000-12-31T10:00:00.000Z',
            height: '100.00', // cm (with 2 digits)
            'is-adult': true
          }
        });
        assert.deepEqual(result, {
          type: 'person',
          id: '123',
          attributes: {
            name: 'Joe',
            birthday: new Date(2000, 11, 31),
            birthtime: new Date('2000-12-31T10:00:00.000Z'),
            height: 1.0, // meters
            isAdult: true
          }
        });
      });

      test('#deserialize will pass null values', function (assert) {
        let result = serializer.deserialize({
          type: 'persons',
          id: '123',
          attributes: {
            birthday: null,
            birthtime: null
          }
        });
        assert.deepEqual(result, {
          type: 'person',
          id: '123',
          attributes: {
            birthday: null,
            birthtime: null
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
    let serializer: JSONAPIResourceSerializer;
    let keyMap: RecordKeyMap;

    hooks.beforeEach(function () {
      keyMap = new RecordKeyMap();
      const schema = new RecordSchema({ models: modelDefinitions });
      const serializerFor = buildJSONAPISerializerFor({ keyMap, schema });
      serializer = new JSONAPIResourceSerializer({
        keyMap,
        schema,
        serializerFor
      });
    });

    test('it exists', function (assert) {
      assert.ok(serializer);
    });

    test('#serialize - can serialize a simple resource with only attributes', function (assert) {
      assert.deepEqual(
        serializer.serialize({
          type: 'planet',
          id: 'jupiter',
          attributes: {
            name: 'Jupiter',
            classification: 'gas giant'
          }
        }),
        {
          type: 'planet',
          attributes: {
            name: 'Jupiter',
            classification: 'gas giant'
          }
        },
        'serialized resource matches'
      );
    });

    test('#serialize - can serialize a resource with attributes and has-many relationships', function (assert) {
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
        }),
        {
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
        },
        'serialized resource matches'
      );
    });

    test('#serialize - can serialize a resource with attributes and a null has-one relationship', function (assert) {
      keyMap.pushRecord({
        type: 'planet',
        id: 'p0',
        keys: { remoteId: 'p1-id' }
      });
      keyMap.pushRecord({
        type: 'moon',
        id: 'm1',
        keys: { remoteId: 'm1-id' }
      });

      assert.deepEqual(
        serializer.serialize({
          type: 'moon',
          id: 'm1',
          attributes: {
            name: 'Io'
          },
          relationships: {
            planet: {
              data: null
            }
          }
        }),
        {
          type: 'moon',
          id: 'm1-id',
          attributes: {
            name: 'Io'
          },
          relationships: {
            planet: { data: null }
          }
        },
        'serialized resource matches'
      );
    });

    test('#serialize - can serialize a resource with attributes and a has-one relationships', function (assert) {
      keyMap.pushRecord({
        type: 'planet',
        id: 'p1',
        keys: { remoteId: 'p1-id' }
      });
      keyMap.pushRecord({
        type: 'solarSystem',
        id: 'ss1',
        keys: { remoteId: 'ss1-id' }
      });

      assert.deepEqual(
        serializer.serialize({
          type: 'planet',
          id: 'p1',
          attributes: {
            name: 'Jupiter'
          },
          relationships: {
            solarSystem: {
              data: { type: 'solarSystem', id: 'ss1' }
            }
          }
        }),
        {
          type: 'planet',
          id: 'p1-id',
          attributes: {
            name: 'Jupiter'
          },
          relationships: {
            solarSystem: {
              data: { type: 'solarSystem', id: 'ss1-id' }
            }
          }
        },
        'serialized resource matches'
      );
    });

    test('#deserialize - can deserialize a simple resource with only type and id - using local IDs', function (assert) {
      let record = serializer.deserialize({
        type: 'planet',
        id: '123'
      });

      assert.deepEqual(
        record,
        {
          id: record.id,
          type: 'planet',
          keys: {
            remoteId: '123'
          }
        },
        'deserialized resource matches'
      );
    });

    test('#deserialize - can deserialize a simple resource and associate it with a local record', function (assert) {
      let localRecord = {
        id: '1a2b3c',
        type: 'planet'
      } as InitializedRecord;

      let record = serializer.deserialize(
        {
          type: 'planet',
          id: '123'
        },
        {
          primaryRecord: localRecord
        }
      );

      assert.deepEqual(
        record,
        {
          id: '1a2b3c',
          type: 'planet',
          keys: {
            remoteId: '123'
          }
        },
        'deserialized resourcehas the id of the local record'
      );
    });
  });
});
