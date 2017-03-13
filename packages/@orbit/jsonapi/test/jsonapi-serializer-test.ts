import { Dict } from '@orbit/utils';
import {
  KeyMap,
  ModelDefinition,
  Schema, SchemaSettings,
  serializeRecordIdentity
} from '@orbit/core';
import JSONAPISerializer from '../src/jsonapi-serializer';
import './test-helper';

const { module, test } = QUnit;

module('JSONAPISerializer', function(hooks) {
  const modelDefinitions: Dict<ModelDefinition> = {
    planet: {
      attributes: {
        name: { type: 'string' },
        classification: { type: 'string' }
      },
      relationships: {
        moons: { type: 'hasMany', model: 'moon', inverse: 'planet' },
        solarSystem: { type: 'hasOne', model: 'solarSystem', inverse: 'planets' }
      }
    },
    moon: {
      attributes: {
        name: { type: 'string' }
      },
      relationships: {
        planet: { type: 'hasOne', model: 'planet', inverse: 'moons' }
      }
    },
    solarSystem: {
      attributes: {
        name: { type: 'string' }
      },
      relationships: {
        planets: { type: 'hasMany', model: 'planet', inverse: 'solarSystem' }
      }
    }
  };

  module('Using local ids', function(hooks) {
    let serializer;
    let keyMap: KeyMap;

    const modelDefaults: ModelDefinition = {
      keys: {
        remoteId: {}
      }
    };

    hooks.beforeEach(function() {
      keyMap = new KeyMap();

      let schema: Schema = new Schema({ models: modelDefinitions, modelDefaults });
      serializer = new JSONAPISerializer({ schema, keyMap });
      serializer.resourceKey = function() { return 'remoteId'; };
    })

    hooks.afterEach(function() {
      keyMap = serializer = null;
    });

    test('it exists', function(assert) {
      assert.ok(serializer);
    });

    test('#resourceType returns the pluralized, dasherized type by default', function(assert) {
      assert.equal(serializer.resourceType('planetaryObject'), 'planetary-objects');
    });

    test('#resourceRelationship returns the dasherized relationship by default', function(assert) {
      assert.equal(serializer.resourceRelationship('planet', 'surfaceElements'), 'surface-elements');
    });

    test('#resourceAttr returns the dasherized attribute by default', function(assert) {
      assert.equal(serializer.resourceRelationship('planet', 'fullName'), 'full-name');
    });

    test('#recordType returns the singularized, camelized type by default', function(assert) {
      assert.equal(serializer.recordType('planetary-objects'), 'planetaryObject');
    });

    test('#recordAttribute returns the camelized attribute by default', function(assert) {
      assert.equal(serializer.recordAttribute('planet', 'full-name'), 'fullName');
    });

    test('#recordRelationship returns the camelized relationship by default', function(assert) {
      assert.equal(serializer.recordRelationship('planet', 'surface-elements'), 'surfaceElements');
    });

    test('#resourceId returns a matching resource id given an orbit id', function(assert) {
      keyMap.pushRecord({ type: 'planet', id: '1', keys: { remoteId: 'a' } });
      keyMap.pushRecord({ type: 'planet', id: '2', keys: { remoteId: 'b' } });

      assert.equal(serializer.resourceId('planet', '1'), 'a');
      assert.equal(serializer.resourceId('planet', '2'), 'b');
    });

    test('#resourceIds returns an array of matching resource ids given an array of orbit ids', function(assert) {
      keyMap.pushRecord({ type: 'planet', id: '1', keys: { remoteId: 'a' } });
      keyMap.pushRecord({ type: 'planet', id: '2', keys: { remoteId: 'b' } });

      assert.deepEqual(serializer.resourceIds('planet', ['1', '2']), ['a', 'b'], 'works for arrays too');
    });

    test('#recordId returns a matching orbit id given a resource id', function(assert) {
      keyMap.pushRecord({ type: 'planet', id: '1', keys: { remoteId: 'a' } });
      keyMap.pushRecord({ type: 'planet', id: '2', keys: { remoteId: 'b' } });

      assert.equal(serializer.recordId('planet', 'a'), '1');
      assert.equal(serializer.recordId('planet', 'b'), '2');
    });

    test('#serializeDocument - can serialize a simple resource with only attributes', function(assert) {
      assert.deepEqual(
        serializer.serializeDocument(
          {
            type: 'planet',
            attributes: {
              name: 'Jupiter',
              classification: 'gas giant'
            }
          }
        ),
        {
          data: {
            type: 'planets',
            attributes: {
              name: 'Jupiter',
              classification: 'gas giant'
            }
          }
        },
        'serialized document matches'
      );
    });

    test('#serializeDocument - can serialize a resource with attributes and has-many relationships', function(assert) {
      keyMap.pushRecord({ type: 'planet', id: 'p1', keys: { remoteId: 'p1-id' } });
      keyMap.pushRecord({ type: 'moon', id: 'm1', keys: { remoteId: 'm1-id' } });
      keyMap.pushRecord({ type: 'moon', id: 'm2', keys: { remoteId: 'm2-id' } });

      assert.deepEqual(
        serializer.serializeDocument(
          {
            type: 'planet',
            id: 'p1',
            attributes: {
              name: 'Jupiter',
              classification: 'gas giant'
            },
            relationships: {
              moons: {
                data: {
                  'moon:m1': true,
                  'moon:m2': true
                }
              }
            }
          }
        ),
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

    test('#serializeDocument - can serialize a resource with attributes and a null has-one relationship', function(assert) {
      keyMap.pushRecord({ type: 'planet', id: 'p0', keys: { remoteId: 'p1-id' } });
      keyMap.pushRecord({ type: 'moon', id: 'm1', keys: { remoteId: 'm1-id' } });

      assert.deepEqual(
        serializer.serializeDocument(
          {
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
        ),
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

    test('#serializeDocument - can serialize a resource with attributes and a has-one relationships', function(assert) {
      keyMap.pushRecord({ type: 'planet', id: 'p1', keys: { remoteId: 'p1-id' } });
      keyMap.pushRecord({ type: 'solarSystem', id: 'ss1', keys: { remoteId: 'ss1-id' } });

      assert.deepEqual(
        serializer.serializeDocument(
          {
            type: 'planet',
            id: 'p1',
            attributes: {
              name: 'Jupiter'
            },
            relationships: {
              solarSystem: {
                data: 'solarSystem:ss1'
              }
            }
          }
        ),
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

    test('#deserialize - can deserialize a simple resource with only type and id - using local IDs', function(assert) {
      let result = serializer.deserializeDocument(
        {
          data: {
            type: 'planets',
            id: '123'
          }
        }
      );
      let record = result.data;

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

    test('#deserialize - can deserialize a compound document', function(assert) {
      let result = serializer.deserializeDocument(
        {
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
          included: [{
            id: '5',
            type: 'moons',
            attributes: {
              name: 'Io'
            },
            relationships: {
              planet: { data: { type: 'planets', id: '12345' } }
            }
          }, {
            id: '6',
            type: 'solar-systems',
            attributes: {
              name: 'The Solar System'
            },
            relationships: {
              planets: { data: [{ type: 'planets', id: '12345' }] }
            }
          }]
        }
      );

      let planet = result.data;
      let moon = result.included[0];
      let solarSystem = result.included[1];
      let planetsMoons = {};
      planetsMoons[`moon:${moon.id}`] = true;
      let ssPlanets = {};
      ssPlanets[`planet:${planet.id}`] = true;

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
                data: planetsMoons
              },
              solarSystem: {
                data: `solarSystem:${solarSystem.id}`
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
                  data: `planet:${planet.id}`
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
                  data: ssPlanets
                }
              }
            }
          ]
        },
        'deserialized document matches'
      );
    });
  });

  module('Using shared UUIDs', function(hooks) {
    let serializer;

    hooks.beforeEach(function() {
      let schema = new Schema({ models: modelDefinitions });
      serializer = new JSONAPISerializer({ schema });
    })

    hooks.afterEach(function() {
      serializer = null;
    });

    test('it exists', function(assert) {
      assert.ok(serializer);
    });

    test('#resourceKey returns \'id\' by default', function(assert) {
      assert.equal(serializer.resourceKey('planet'), 'id');
    });

    test('#resourceId returns a matching resource id given an orbit id', function(assert) {
      serializer.deserializeDocument({ data: { type: 'planet', id: 'a' } });
      serializer.deserializeDocument({ data: { type: 'planet', id: 'b' } });

      assert.equal(serializer.resourceId('planet', 'a'), 'a');
      assert.equal(serializer.resourceId('planet', 'b'), 'b');
    });

    test('#resourceIds returns an array of matching resource ids given an array of orbit ids', function(assert) {
      serializer.deserializeDocument({ data: { type: 'planet', id: 'a' } });
      serializer.deserializeDocument({ data: { type: 'planet', id: 'b' } });

      assert.deepEqual(serializer.resourceIds('planet', ['a', 'b']), ['a', 'b'], 'works for arrays too');
    });

    test('#recordId returns a matching orbit id given a resource id - using UUIDs', function(assert) {
      serializer.deserializeDocument({ data: { type: 'planet', id: 'a' } });
      serializer.deserializeDocument({ data: { type: 'planet', id: 'b' } });

      assert.equal(serializer.recordId('planet', 'a'), 'a');
      assert.equal(serializer.recordId('planet', 'b'), 'b');
    });

    test('#serialize - can serialize a simple resource with only type and id', function(assert) {
      assert.deepEqual(
        serializer.serializeDocument(
          {
            type: 'planet',
            id: '123'
          }
        ),
        {
          data: {
            type: 'planets',
            id: '123'
          }
        },
        'serialized document matches'
      );
    });

    test('#deserialize - can deserialize a simple resource with only type and id', function(assert) {
      let result = serializer.deserializeDocument(
        {
          data: {
            type: 'planets',
            id: '123'
          }
        }
      );
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

    test('#deserialize - can deserialize a compound document', function(assert) {
      let result = serializer.deserializeDocument(
        {
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
          included: [{
            id: '5',
            type: 'moons',
            attributes: {
              name: 'Io'
            },
            relationships: {
              planet: { data: { type: 'planets', id: '12345' } }
            }
          }]
        }
      );

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
                data: {
                  'moon:5': true
                }
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
                  data: 'planet:12345'
                }
              }
            }
          ]
        },
        'deserialized document matches'
      );
    });
  });
});
