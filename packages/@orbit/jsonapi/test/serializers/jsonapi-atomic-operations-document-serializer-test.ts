import { Dict } from '@orbit/utils';
import { ModelDefinition, RecordSchema } from '@orbit/records';
import { JSONAPIAtomicOperationsDocumentSerializer } from '../../src/serializers/jsonapi-atomic-operations-document-serializer';
import { buildJSONAPISerializerFor } from '../../src/serializers/jsonapi-serializer-builder';

const { module, test } = QUnit;

module('JSONAPIOperationsDocumentSerializer', function (hooks) {
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
      let serializer: JSONAPIAtomicOperationsDocumentSerializer;

      hooks.beforeEach(function () {
        const schema = new RecordSchema({ models: modelDefinitions });
        const serializerFor = buildJSONAPISerializerFor({ schema });
        serializer = new JSONAPIAtomicOperationsDocumentSerializer({
          schema,
          serializerFor
        });
      });

      test('it exists', function (assert) {
        assert.ok(serializer);
      });

      test('#serialize', function (assert) {
        const result = serializer.serialize({
          operations: [
            {
              op: 'updateRecord',
              record: {
                id: '1',
                type: 'planet',
                attributes: {
                  name: 'Earth'
                }
              }
            },
            {
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
            },
            {
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
            },
            {
              op: 'replaceRelatedRecord',
              record: {
                id: '2',
                type: 'planet'
              },
              relatedRecord: null,
              relationship: 'solarSystem'
            },
            {
              op: 'removeRecord',
              record: {
                id: '1',
                type: 'planet'
              }
            },
            {
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
            },
            {
              op: 'addRecord',
              record: {
                id: '3',
                type: 'moon',
                attributes: {
                  name: 'Io'
                }
              }
            }
          ]
        });

        assert.deepEqual(result, {
          'atomic:operations': [
            {
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
            },
            {
              op: 'update',
              ref: {
                id: '1',
                type: 'planet',
                relationship: 'moons'
              },
              data: [
                {
                  type: 'moon',
                  id: '2'
                }
              ]
            },
            {
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
            },
            {
              op: 'update',
              ref: {
                id: '2',
                type: 'planet',
                relationship: 'solarSystem'
              },
              data: null
            },
            {
              op: 'remove',
              ref: {
                id: '1',
                type: 'planet'
              }
            },
            {
              op: 'remove',
              ref: {
                id: '1',
                type: 'planet',
                relationship: 'moons'
              },
              data: {
                type: 'moon',
                id: '2'
              }
            },
            {
              op: 'add',
              ref: {
                type: 'moon',
                id: '3'
              },
              data: {
                id: '3',
                type: 'moon',
                attributes: {
                  name: 'Io'
                }
              }
            }
          ]
        });
      });

      test('#deserialize', function (assert) {
        const result = serializer.deserialize({
          'atomic:operations': [
            {
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
            },
            {
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
            },
            {
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
            },
            {
              op: 'update',
              ref: {
                id: '2',
                type: 'planet',
                relationship: 'solarSystem'
              },
              data: null
            },
            {
              op: 'remove',
              ref: {
                id: '1',
                type: 'planet'
              }
            },
            {
              op: 'remove',
              ref: {
                type: 'planet',
                id: '1',
                relationship: 'moons'
              },
              data: {
                id: '2',
                type: 'moon'
              }
            },
            {
              op: 'add',
              ref: {
                id: '3',
                type: 'moon'
              },
              data: {
                type: 'moon',
                id: '3',
                attributes: {
                  name: 'Io'
                }
              }
            }
          ]
        });

        assert.deepEqual(result, {
          operations: [
            {
              op: 'updateRecord',
              record: {
                id: '1',
                type: 'planet',
                attributes: {
                  name: 'Earth'
                }
              }
            },
            {
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
            },
            {
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
            },
            {
              op: 'replaceRelatedRecord',
              record: {
                id: '2',
                type: 'planet'
              },
              relatedRecord: null,
              relationship: 'solarSystem'
            },
            {
              op: 'removeRecord',
              record: {
                id: '1',
                type: 'planet'
              }
            },
            {
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
            },
            {
              op: 'addRecord',
              record: {
                id: '3',
                type: 'moon',
                attributes: {
                  name: 'Io'
                }
              }
            }
          ]
        });
      });
    });
  });
});
