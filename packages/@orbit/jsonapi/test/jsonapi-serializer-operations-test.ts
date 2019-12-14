import { Dict } from '@orbit/utils';
import { ModelDefinition, Schema } from '@orbit/data';

import { JSONAPISerializer, ResourceOperationsDocument } from '../src/index';

const { module, test } = QUnit;

module('JSONAPISerializer', function(hooks) {
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

  const operationsDocument: ResourceOperationsDocument = {
    operations: [
      {
        op: 'update',
        ref: {
          type: 'planets',
          id: '1'
        },
        data: {
          type: 'planets',
          id: '1',
          attributes: {
            name: 'Earth'
          }
        }
      },
      {
        op: 'update',
        ref: {
          type: 'planets',
          id: '1',
          relationship: 'moons'
        },
        data: [
          {
            type: 'moons',
            id: '2'
          }
        ]
      },
      {
        op: 'update',
        ref: {
          type: 'planets',
          id: '1',
          relationship: 'solarSystem'
        },
        data: {
          type: 'solar-systems',
          id: '3'
        }
      },
      {
        op: 'update',
        ref: {
          type: 'planets',
          id: '2',
          relationship: 'solarSystem'
        },
        data: null
      },
      {
        op: 'remove',
        ref: {
          type: 'planets',
          id: '1'
        }
      },
      {
        op: 'remove',
        ref: {
          type: 'planets',
          id: '1',
          relationship: 'moons'
        },
        data: {
          type: 'moons',
          id: '2'
        }
      },
      {
        op: 'add',
        ref: {
          type: 'moons',
          id: '3'
        },
        data: {
          type: 'moons',
          id: '3',
          attributes: {
            name: 'Io'
          }
        }
      }
    ]
  };

  let serializer: JSONAPISerializer;

  hooks.beforeEach(function() {
    let schema: Schema = new Schema({ models: modelDefinitions });
    serializer = new JSONAPISerializer({ schema });
  });

  hooks.afterEach(function() {
    serializer = null;
  });

  test('deserializeOperationsDocument', function(assert) {
    const operations = serializer.deserializeOperationsDocument(
      operationsDocument
    );
    assert.deepEqual(operations, [
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
    ]);
  });

  test('deserializeOperations', function(assert) {
    const operations = serializer.deserializeOperations([
      {
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
      },
      {
        op: 'add',
        ref: {
          type: 'moon',
          id: '3'
        },
        data: {
          type: 'moon',
          id: '3',
          attributes: {
            name: 'Io'
          }
        }
      }
    ]);
    assert.deepEqual(operations, [
      {
        op: 'updateRecord',
        record: {
          type: 'planet',
          id: '1',
          attributes: {
            name: 'Earth'
          }
        }
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
    ]);
  });

  test('deserializeOperation', function(assert) {
    const operation = serializer.deserializeOperation({
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

  test('deserializeOperation throws on get', function(assert) {
    assert.throws(() => {
      serializer.deserializeOperation({
        op: 'get',
        ref: {
          type: 'planet',
          id: '1'
        }
      });
    }, '"get" operation recieved');
  });

  test('serializeOperation', function(assert) {
    const operation = serializer.serializeOperation({
      op: 'updateRecord',
      record: {
        type: 'planet',
        id: '1',
        attributes: {
          name: 'Earth'
        }
      }
    });

    assert.deepEqual(operation, {
      op: 'update',
      ref: {
        type: 'planets',
        id: '1'
      },
      data: {
        type: 'planets',
        id: '1',
        attributes: {
          name: 'Earth'
        }
      }
    });
  });

  test('serializeOperations', function(assert) {
    const operations = serializer.serializeOperations([
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
    ]);

    assert.deepEqual(operations, [
      {
        op: 'update',
        ref: {
          type: 'planets',
          id: '1'
        },
        data: {
          type: 'planets',
          id: '1',
          attributes: {
            name: 'Earth'
          }
        }
      },
      {
        op: 'update',
        ref: {
          type: 'planets',
          id: '1',
          relationship: 'moons'
        },
        data: [
          {
            type: 'moons',
            id: '2'
          }
        ]
      },
      {
        op: 'update',
        ref: {
          type: 'planets',
          id: '1',
          relationship: 'solarSystem'
        },
        data: {
          type: 'solar-systems',
          id: '3'
        }
      },
      {
        op: 'update',
        ref: {
          type: 'planets',
          id: '2',
          relationship: 'solarSystem'
        },
        data: null
      },
      {
        op: 'remove',
        ref: {
          type: 'planets',
          id: '1'
        }
      },
      {
        op: 'remove',
        ref: {
          type: 'planets',
          id: '1',
          relationship: 'moons'
        },
        data: {
          type: 'moons',
          id: '2'
        }
      },
      {
        op: 'add',
        ref: {
          type: 'moons',
          id: '3'
        },
        data: {
          type: 'moons',
          id: '3',
          attributes: {
            name: 'Io'
          }
        }
      }
    ]);
  });
});
