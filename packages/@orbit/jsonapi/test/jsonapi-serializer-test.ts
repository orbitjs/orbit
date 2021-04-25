import { Dict } from '@orbit/utils';
import {
  RecordKeyMap,
  ModelDefinition,
  InitializedRecord,
  RecordSchema
} from '@orbit/records';
import { JSONAPISerializer } from '../src/jsonapi-serializer';
import { Serializer } from '@orbit/serializers';

const { module, test } = QUnit;

module('JSONAPISerializer', function (hooks) {
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
      let serializer: JSONAPISerializer;

      hooks.beforeEach(function () {
        let schema = new RecordSchema({ models: modelDefinitions });
        serializer = new JSONAPISerializer({ schema });
      });

      test('it exists', function (assert) {
        assert.ok(serializer);
      });

      test("#resourceKey returns 'id' by default", function (assert) {
        assert.equal(serializer.resourceKey('planet'), 'id');
      });

      test('#resourceId returns a matching resource id given an orbit id', function (assert) {
        serializer.deserialize({ data: { type: 'planets', id: 'a' } });
        serializer.deserialize({ data: { type: 'planets', id: 'b' } });

        assert.equal(serializer.resourceId('planet', 'a'), 'a');
        assert.equal(serializer.resourceId('planet', 'b'), 'b');
      });

      test('#resourceIds returns an array of matching resource ids given an array of orbit ids', function (assert) {
        serializer.deserialize({ data: { type: 'planets', id: 'a' } });
        serializer.deserialize({ data: { type: 'planets', id: 'b' } });

        assert.deepEqual(
          serializer.resourceIds('planet', ['a', 'b']),
          ['a', 'b'],
          'works for arrays too'
        );
      });

      test('#recordId returns a matching orbit id given a resource id - using UUIDs', function (assert) {
        serializer.deserialize({ data: { type: 'planets', id: 'a' } });
        serializer.deserialize({ data: { type: 'planets', id: 'b' } });

        assert.equal(serializer.recordId('planet', 'a'), 'a');
        assert.equal(serializer.recordId('planet', 'b'), 'b');
      });

      test('#serialize - can serialize a simple resource with only type and id', function (assert) {
        assert.deepEqual(
          serializer.serialize({
            data: {
              type: 'planet',
              id: '123'
            }
          }),
          {
            data: {
              type: 'planets',
              id: '123'
            }
          },
          'serialized document matches'
        );
      });

      test('#serialize - ignores attributes and relationships not defined in the schema', function (assert) {
        assert.deepEqual(
          serializer.serialize({
            data: {
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
            }
          }),
          {
            data: {
              type: 'planets',
              id: '123'
            }
          },
          'serialized document excludes unknown data'
        );
      });

      test('#deserialize - can deserialize a simple resource with only type and id', function (assert) {
        let result = serializer.deserialize({
          data: {
            type: 'planets',
            id: '123'
          }
        });
        let record = result.data;

        assert.deepEqual(
          record,
          {
            type: 'planet',
            id: '123'
          },
          'deserialized document matches'
        );
      });

      test('#deserialize - can deserialize a compound document', function (assert) {
        let result = serializer.deserialize({
          data: {
            id: '12345',
            type: 'planets',
            attributes: {
              name: 'Jupiter',
              classification: 'gas giant'
            },
            relationships: {
              moons: { data: [{ type: 'moons', id: '5' }] }
            }
          },
          included: [
            {
              id: '5',
              type: 'moons',
              attributes: {
                name: 'Io'
              },
              relationships: {
                planet: { data: { type: 'planets', id: '12345' } }
              }
            }
          ]
        });

        assert.deepEqual(
          result,
          {
            data: {
              type: 'planet',
              id: '12345',
              attributes: {
                classification: 'gas giant',
                name: 'Jupiter'
              },
              relationships: {
                moons: {
                  data: [{ type: 'moon', id: '5' }]
                }
              }
            },
            included: [
              {
                type: 'moon',
                id: '5',
                attributes: {
                  name: 'Io'
                },
                relationships: {
                  planet: {
                    data: { type: 'planet', id: '12345' }
                  }
                }
              }
            ]
          },
          'deserialized document matches'
        );
      });

      test('#deserialize - ignores attributes and relationships not defined in the schema', function (assert) {
        let result = serializer.deserialize({
          data: {
            id: '12345',
            type: 'planets',
            attributes: {
              name: 'Jupiter',
              unknownAttribute: 'gas giant'
            },
            relationships: {
              moons: { data: [{ type: 'moons', id: '5' }] },
              unknownRelationship: { data: { type: 'solarSystem', id: 'ss1' } }
            }
          }
        });

        assert.deepEqual(result, {
          data: {
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

      let serializer: JSONAPISerializer;

      hooks.beforeEach(function () {
        let schema = new RecordSchema({ models: modelDefinitions });
        serializer = new JSONAPISerializer({
          schema,
          serializers: {
            distance: new DistanceSerializer()
          }
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

      test('#serialize will use available serializers for attribute values', function (assert) {
        assert.deepEqual(
          serializer.serialize({
            data: {
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
          }),
          {
            data: {
              type: 'persons',
              id: '123',
              attributes: {
                name: 'Joe',
                birthday: '2000-12-31',
                birthtime: '2000-12-31T10:00:00.000Z',
                height: '100.00', // cm (with 2 digits)
                'is-adult': true
              }
            }
          },
          'serialized document matches'
        );
      });

      test('#serialize will pass null values without throwing', function (assert) {
        assert.deepEqual(
          serializer.serialize({
            data: {
              type: 'person',
              id: '123',
              attributes: {
                name: null,
                birthday: null,
                birthtime: null,
                height: null, // meters
                isAdult: null
              }
            }
          }),
          {
            data: {
              type: 'persons',
              id: '123',
              attributes: {
                name: null,
                birthday: null,
                birthtime: null,
                height: null, // cm (with 2 digits)
                'is-adult': null
              }
            }
          },
          'serialized document matches'
        );
      });

      test('#deserialize will use available serializers for attribute values', function (assert) {
        let result = serializer.deserialize({
          data: {
            type: 'persons',
            id: '123',
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
          data: {
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
      });

      test('#deserialize will pass null values', function (assert) {
        let result = serializer.deserialize({
          data: {
            type: 'persons',
            id: '123',
            attributes: {
              birthday: null,
              birthtime: null
            }
          }
        });
        assert.deepEqual(result, {
          data: {
            type: 'person',
            id: '123',
            attributes: {
              birthday: null,
              birthtime: null
            }
          }
        });
      });
    });

    module('Deserialize links and meta', function (hooks) {
      let serializer: JSONAPISerializer;

      hooks.beforeEach(function () {
        let schema = new RecordSchema({ models: modelDefinitions });
        serializer = new JSONAPISerializer({ schema });
      });

      test('it exists', function (assert) {
        assert.ok(serializer);
      });

      test('it deserializes links and meta at the document-level', function (assert) {
        let result = serializer.deserialize({
          links: {
            self: 'https://example.com/planets/12345/moons'
          },
          meta: {
            abc: '123',
            def: '456'
          },
          data: []
        });

        assert.deepEqual(result, {
          links: {
            self: 'https://example.com/planets/12345/moons'
          },
          meta: {
            abc: '123',
            def: '456'
          },
          data: []
        });
      });

      test('it deserializes links and meta in records', function (assert) {
        let result = serializer.deserialize({
          data: {
            id: '12345',
            type: 'planets',
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
              moons: { data: [{ type: 'moons', id: '5' }] },
              'solar-system': { data: { type: 'solar-systems', id: '6' } }
            }
          }
        });
        let planet = result.data as InitializedRecord;
        assert.deepEqual(result, {
          data: {
            type: 'planet',
            id: planet.id,
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
          }
        });
      });

      test('it deserializes links and meta in hasOne relationship', function (assert) {
        let result = serializer.deserialize({
          data: {
            id: '12345',
            type: 'planets',
            attributes: {
              name: 'Jupiter',
              classification: 'gas giant'
            },
            links: {
              self: 'https://example.com/api/planets/12345'
            },
            relationships: {
              moons: { data: [{ type: 'moons', id: '5' }] },
              'solar-system': {
                data: { type: 'solar-systems', id: '6' },
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
          }
        });
        let planet = result.data as InitializedRecord;
        assert.deepEqual(result, {
          data: {
            type: 'planet',
            id: planet.id,
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
          }
        });
      });

      test('it deserializes links and meta in hasMany relationship', function (assert) {
        let result = serializer.deserialize({
          data: {
            id: '12345',
            type: 'planets',
            attributes: {
              name: 'Jupiter',
              classification: 'gas giant'
            },
            links: {
              self: 'https://example.com/api/planets/12345'
            },
            relationships: {
              moons: {
                data: [{ type: 'moons', id: '5' }],
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
              'solar-system': {
                data: { type: 'solar-systems', id: '6' }
              }
            }
          }
        });
        let planet = result.data as InitializedRecord;
        assert.deepEqual(result, {
          data: {
            type: 'planet',
            id: planet.id,
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
          }
        });
      });

      test('it deserializes links and meta in hasOne relationship without data', function (assert) {
        let result = serializer.deserialize({
          data: {
            id: '12345',
            type: 'planets',
            attributes: {
              name: 'Jupiter',
              classification: 'gas giant'
            },
            links: {
              self: 'https://example.com/api/planets/12345'
            },
            relationships: {
              moons: { data: [{ type: 'moons', id: '5' }] },
              'solar-system': {
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
          }
        });
        let planet = result.data as InitializedRecord;
        assert.deepEqual(result, {
          data: {
            type: 'planet',
            id: planet.id,
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
          }
        });
      });

      test('it deserializes links in hasMany relationship without data', function (assert) {
        let result = serializer.deserialize({
          data: {
            id: '12345',
            type: 'planets',
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
              'solar-system': { data: { type: 'solar-systems', id: '6' } }
            }
          }
        });
        let planet = result.data as InitializedRecord;
        assert.deepEqual(result, {
          data: {
            type: 'planet',
            id: planet.id,
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

    let serializer: JSONAPISerializer;
    let keyMap: RecordKeyMap;

    hooks.beforeEach(function () {
      keyMap = new RecordKeyMap();
      let schema = new RecordSchema({ models: modelDefinitions });
      serializer = new JSONAPISerializer({ keyMap, schema });
      serializer.resourceKey = function () {
        return 'remoteId';
      };
    });

    test('it exists', function (assert) {
      assert.ok(serializer);
    });

    test('#resourceType returns the pluralized, dasherized type by default', function (assert) {
      assert.equal(
        serializer.resourceType('planetaryObject'),
        'planetary-objects'
      );
    });

    test('#resourceRelationship returns the dasherized relationship by default', function (assert) {
      assert.equal(
        serializer.resourceRelationship('planet', 'surfaceElements'),
        'surface-elements'
      );
    });

    test('#resourceAttr returns the dasherized attribute by default', function (assert) {
      assert.equal(
        serializer.resourceRelationship('planet', 'fullName'),
        'full-name'
      );
    });

    test('#recordType returns the singularized, camelized type by default', function (assert) {
      assert.equal(
        serializer.recordType('planetary-objects'),
        'planetaryObject'
      );
    });

    test('#recordAttribute returns the camelized attribute by default', function (assert) {
      assert.equal(
        serializer.recordAttribute('planet', 'full-name'),
        'fullName'
      );
    });

    test('#recordRelationship returns the camelized relationship by default', function (assert) {
      assert.equal(
        serializer.recordRelationship('planet', 'surface-elements'),
        'surfaceElements'
      );
    });

    test('#resourceId returns a matching resource id given an orbit id', function (assert) {
      keyMap.pushRecord({ type: 'planet', id: '1', keys: { remoteId: 'a' } });
      keyMap.pushRecord({ type: 'planet', id: '2', keys: { remoteId: 'b' } });

      assert.equal(serializer.resourceId('planet', '1'), 'a');
      assert.equal(serializer.resourceId('planet', '2'), 'b');
    });

    test('#resourceId returns `undefined` when an entry cannot be found in the keyMap', function (assert) {
      assert.strictEqual(serializer.resourceId('planet', '1'), undefined);
    });

    test('#resourceIds returns an array of matching resource ids given an array of orbit ids', function (assert) {
      keyMap.pushRecord({ type: 'planet', id: '1', keys: { remoteId: 'a' } });
      keyMap.pushRecord({ type: 'planet', id: '2', keys: { remoteId: 'b' } });

      assert.deepEqual(
        serializer.resourceIds('planet', ['1', '2']),
        ['a', 'b'],
        'works for arrays too'
      );
    });

    test('#recordId returns a matching orbit id given a resource id', function (assert) {
      keyMap.pushRecord({ type: 'planet', id: '1', keys: { remoteId: 'a' } });
      keyMap.pushRecord({ type: 'planet', id: '2', keys: { remoteId: 'b' } });

      assert.equal(serializer.recordId('planet', 'a'), '1');
      assert.equal(serializer.recordId('planet', 'b'), '2');
    });

    test('#serialize - can serialize a simple resource with only attributes', function (assert) {
      keyMap.pushRecord({
        type: 'planet',
        id: 'jupiter',
        keys: { remoteId: '1' }
      });

      assert.deepEqual(
        serializer.serialize({
          data: {
            type: 'planet',
            id: 'jupiter',
            attributes: {
              name: 'Jupiter',
              classification: 'gas giant'
            }
          }
        }),
        {
          data: {
            type: 'planets',
            id: '1',
            attributes: {
              name: 'Jupiter',
              classification: 'gas giant'
            }
          }
        },
        'serialized document matches'
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
          data: {
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
          data: {
            type: 'planets',
            id: 'p1-id',
            attributes: {
              name: 'Jupiter',
              classification: 'gas giant'
            },
            relationships: {
              moons: {
                data: [
                  { type: 'moons', id: 'm1-id' },
                  { type: 'moons', id: 'm2-id' }
                ]
              }
            }
          }
        },
        'serialized document matches'
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
          data: {
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
          }
        }),
        {
          data: {
            type: 'moons',
            id: 'm1-id',
            attributes: {
              name: 'Io'
            },
            relationships: {
              planet: { data: null }
            }
          }
        },
        'serialized document matches'
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
          data: {
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
          }
        }),
        {
          data: {
            type: 'planets',
            id: 'p1-id',
            attributes: {
              name: 'Jupiter'
            },
            relationships: {
              'solar-system': {
                data: { type: 'solar-systems', id: 'ss1-id' }
              }
            }
          }
        },
        'serialized document matches'
      );
    });

    test('#deserialize - can deserialize a simple resource with only type and id - using local IDs', function (assert) {
      let result = serializer.deserialize({
        data: {
          type: 'planets',
          id: '123'
        }
      });
      let record = result.data as InitializedRecord;

      assert.deepEqual(
        record,
        {
          id: record.id,
          type: 'planet',
          keys: {
            remoteId: '123'
          }
        },
        'deserialized document matches'
      );
    });

    test('#deserialize - can deserialize a simple resource and associate it with a local record', function (assert) {
      let localRecord = {
        id: '1a2b3c',
        type: 'planet'
      } as InitializedRecord;

      let result = serializer.deserialize(
        {
          data: {
            type: 'planets',
            id: '123'
          }
        },
        {
          primaryRecord: localRecord
        }
      );

      let record = result.data;

      assert.deepEqual(
        record,
        {
          id: '1a2b3c',
          type: 'planet',
          keys: {
            remoteId: '123'
          }
        },
        'deserialized document has the id of the local record'
      );
    });

    test('#deserialize - can deserialize a compound document', function (assert) {
      let result = serializer.deserialize({
        data: {
          id: '12345',
          type: 'planets',
          attributes: {
            name: 'Jupiter',
            classification: 'gas giant'
          },
          relationships: {
            moons: { data: [{ type: 'moons', id: '5' }] },
            'solar-system': { data: { type: 'solar-systems', id: '6' } }
          }
        },
        included: [
          {
            id: '5',
            type: 'moons',
            attributes: {
              name: 'Io'
            },
            relationships: {
              planet: { data: { type: 'planets', id: '12345' } }
            }
          },
          {
            id: '6',
            type: 'solar-systems',
            attributes: {
              name: 'The Solar System'
            },
            relationships: {
              planets: { data: [{ type: 'planets', id: '12345' }] }
            }
          }
        ]
      });

      let planet = result.data as InitializedRecord;
      let moon = result.included?.[0] as InitializedRecord;
      let solarSystem = result.included?.[1] as InitializedRecord;

      assert.deepEqual(
        result,
        {
          data: {
            type: 'planet',
            id: planet.id,
            keys: {
              remoteId: '12345'
            },
            attributes: {
              classification: 'gas giant',
              name: 'Jupiter'
            },
            relationships: {
              moons: {
                data: [{ type: 'moon', id: moon.id }]
              },
              solarSystem: {
                data: { type: 'solarSystem', id: solarSystem.id }
              }
            }
          },
          included: [
            {
              type: 'moon',
              id: moon.id,
              keys: {
                remoteId: '5'
              },
              attributes: {
                name: 'Io'
              },
              relationships: {
                planet: {
                  data: { type: 'planet', id: planet.id }
                }
              }
            },
            {
              type: 'solarSystem',
              id: solarSystem.id,
              keys: {
                remoteId: '6'
              },
              attributes: {
                name: 'The Solar System'
              },
              relationships: {
                planets: {
                  data: [{ type: 'planet', id: planet.id }]
                }
              }
            }
          ]
        },
        'deserialized document matches'
      );
    });

    test('#deserialize - can deserialize null as primary data', function (assert) {
      let result = serializer.deserialize({
        data: null
      });
      let record = result.data;

      assert.equal(record, null, 'deserialized document matches');
    });

    test('#deserialize - can deserialize an array of records', function (assert) {
      let result = serializer.deserialize({
        data: [
          { type: 'planets', id: '123' },
          { type: 'planets', id: '234' }
        ]
      });
      let records = result.data as InitializedRecord[];

      assert.deepEqual(
        records,
        [
          {
            id: records[0].id,
            type: 'planet',
            keys: { remoteId: '123' }
          },
          {
            id: records[1].id,
            type: 'planet',
            keys: { remoteId: '234' }
          }
        ],
        'deserialized document matches'
      );
    });

    test('#deserialize - can deserialize an array of records and associate them with local records', function (assert) {
      let localRecords = [
        { id: '1a2b3c' },
        { id: '4d5e6f' }
      ] as InitializedRecord[];
      let result = serializer.deserialize(
        {
          data: [
            { type: 'planets', id: '123' },
            { type: 'planets', id: '234' }
          ]
        },
        {
          primaryRecords: localRecords
        }
      );
      let records = result.data as InitializedRecord[];

      assert.deepEqual(
        records,
        [
          {
            id: localRecords[0].id,
            type: 'planet',
            keys: { remoteId: '123' }
          },
          {
            id: localRecords[1].id,
            type: 'planet',
            keys: { remoteId: '234' }
          }
        ],
        'deserialized document matches'
      );
    });
  });
});
