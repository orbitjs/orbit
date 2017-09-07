import {
  verifyLocalStorageContainsRecord,
  verifyLocalStorageDoesNotContainRecord,
  verifyLocalStorageIsEmpty
} from './support/local-storage';
import {
  Transform,
  Schema,
  Source,
  KeyMap
} from '@orbit/data';
import LocalStorageSource from '../src/source';
import './test-helper';

const { module, test } = QUnit;

module('LocalStorageSource', function(hooks) {
  let schema: Schema,
      source: LocalStorageSource,
      keyMap: KeyMap;

  hooks.beforeEach(() => {
    schema = new Schema({
      models: {
        planet: {
          keys: { remoteId: {} },
          attributes: {
            name: { type: 'string' },
            classification: { type: 'string' },
            revised: { type: 'boolean' }
          },
          relationships: {
            moons: { type: 'hasMany', model: 'moon' },
            solarSystem: { type: 'hasMany', model: 'solarSystem' }
          }
        },
        moon: {
          keys: { remoteId: {} }
        },
        solarSystem: {
          keys: { remoteId: {} }
        }
      }
    });

    keyMap = new KeyMap();

    source = new LocalStorageSource({ schema, keyMap });
  });

  hooks.afterEach(() => {
    return source.reset()
      .then(() => {
        schema = source = keyMap = null;
      });
  });

  test('it exists', function(assert) {
    assert.ok(source);
    assert.strictEqual(source.schema, schema, 'schema has been assigned');
    assert.strictEqual(source.keyMap, keyMap, 'keyMap has been assigned');
   });

  test('its prototype chain is correct', function(assert) {
    assert.ok(source instanceof Source, 'instanceof Source');
  });

  test('is assigned a default namespace and delimiter', function(assert) {
    assert.equal(source.namespace, 'orbit', 'namespace is `orbit` by default');
    assert.equal(source.delimiter, '/', 'delimiter is `/` by default');
  });

  test('#getKeyForRecord returns the local storage key that will be used for a record', function(assert) {
    assert.equal(
      source.getKeyForRecord({type: 'planet', id: 'jupiter'}),
      'orbit/planet/jupiter'
    );
  });

  test('#push - addRecord', function(assert) {
    assert.expect(2);

    let planet = {
      type: 'planet',
      id: 'jupiter',
      keys: {
        remoteId: 'j'
      },
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    };

    return source.push(t => t.addRecord(planet))
      .then(() => verifyLocalStorageContainsRecord(assert, source, planet))
      .then(() => {
        assert.equal(keyMap.keyToId('planet', 'remoteId', 'j'), 'jupiter', 'key has been mapped');
      });
   });

  test('#push - replaceRecord', function(assert) {
    assert.expect(2);

    let original = {
      type: 'planet',
      id: 'jupiter',
      keys: {
        remoteId: 'j'
      },
      attributes: {
        name: 'Jupiter',
      },
      relationships: {
        moons: {
          data: [{ type: 'moon', id: 'moon1' }]
        }
      }
    };

    let updates = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        classification: 'gas giant'
      },
      relationships: {
        solarSystem: {
          data: { type: 'solarSystem', id: 'ss1' }
        }
      }
    };

    let expected = {
      type: 'planet',
      id: 'jupiter',
      keys: {
        remoteId: 'j'
      },
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      },
      relationships: {
        moons: {
          data: [{ type: 'moon', id: 'moon1' }]
        },
        solarSystem: {
          data: { type: 'solarSystem', id: 'ss1' }
        }
      }
    };

    return source.push(t => t.addRecord(original))
      .then(() => source.push(t => t.replaceRecord(updates)))
      .then(() => verifyLocalStorageContainsRecord(assert, source, expected))
      .then(() => {
        assert.equal(keyMap.keyToId('planet', 'remoteId', 'j'), 'jupiter', 'key has been mapped');
      });
  });

  test('#push - replaceRecord - when record does not exist', function(assert) {
    assert.expect(1);

    let revised = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        revised: true
      }
    };

    return source.push(t => t.replaceRecord(revised))
      .then(() => verifyLocalStorageContainsRecord(assert, source, revised));
  });

  test('#push - removeRecord', function(assert) {
    assert.expect(1);

    let planet = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    };

    return source.push(t => t.addRecord(planet))
      .then(() => source.push(t => t.removeRecord(planet)))
      .then(() => verifyLocalStorageDoesNotContainRecord(assert, source, planet));
  });

  test('#push - removeRecord - when record does not exist', function(assert) {
    assert.expect(1);

    let planet = {
      type: 'planet',
      id: 'jupiter'
    };

    return source.push(t => t.removeRecord(planet))
      .then(() => verifyLocalStorageDoesNotContainRecord(assert, source, planet));
  });

  test('#push - replaceKey', function(assert) {
    assert.expect(2);

    let original = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    };

    let revised = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      },
      keys: {
        remoteId: '123'
      }
    };

    return source.push(t => t.addRecord(original))
      .then(() => source.push(t => t.replaceKey(original, 'remoteId', '123')))
      .then(() => verifyLocalStorageContainsRecord(assert, source, revised))
      .then(() => {
        assert.equal(keyMap.keyToId('planet', 'remoteId', '123'), 'jupiter', 'key has been mapped');
      });
  });

  test('#push - replaceKey - when base record does not exist', function(assert) {
    assert.expect(2);

    let revised = {
      type: 'planet',
      id: 'jupiter',
      keys: {
        remoteId: '123'
      }
    };

    return source.push(t => t.replaceKey({ type: 'planet', id: 'jupiter' }, 'remoteId', '123'))
      .then(() => verifyLocalStorageContainsRecord(assert, source, revised))
      .then(() => {
        assert.equal(keyMap.keyToId('planet', 'remoteId', '123'), 'jupiter', 'key has been mapped');
      });
  });

  test('#push - replaceAttribute', function(assert) {
    assert.expect(1);

    let original = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    };

    let revised = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        order: 5
      }
    };

    return source.push(t => t.addRecord(original))
      .then(() => source.push(t => t.replaceAttribute(original, 'order', 5)))
      .then(() => verifyLocalStorageContainsRecord(assert, source, revised));
  });

  test('#push - replaceAttribute - when base record does not exist', function(assert) {
    assert.expect(1);

    let revised = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        order: 5
      }
    };

    return source.push(t => t.replaceAttribute({ type: 'planet', id: 'jupiter' }, 'order', 5))
      .then(() => verifyLocalStorageContainsRecord(assert, source, revised));
  });

  test('#push - addToRelatedRecords', function(assert) {
    assert.expect(1);

    let original = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      },
      relationships: {
        moons: {
          data: []
        }
      }
    };

    let revised = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      },
      relationships: {
        moons: {
          data: [{ type: 'moon', id: 'moon1' }]
        }
      }
    };

    return source.push(t => t.addRecord(original))
      .then(() => source.push(t => t.addToRelatedRecords(original, 'moons', { type: 'moon', id: 'moon1' })))
      .then(() => verifyLocalStorageContainsRecord(assert, source, revised));
  });

  test('#push - addToRelatedRecords - when base record does not exist', function(assert) {
    assert.expect(1);

    let revised = {
      type: 'planet',
      id: 'jupiter',
      relationships: {
        moons: {
          data: [{ type: 'moon', id: 'moon1' }]
        }
      }
    };

    return source.push(t => t.addToRelatedRecords({ type: 'planet', id: 'jupiter' }, 'moons', { type: 'moon', id: 'moon1' }))
      .then(() => verifyLocalStorageContainsRecord(assert, source, revised));
  });

  test('#push - removeFromRelatedRecords', function(assert) {
    assert.expect(1);

    let original = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      },
      relationships: {
        moons: {
          data: [
            { type: 'moon', id: 'moon1' },
            { type: 'moon', id: 'moon2' }
          ]
        }
      }
    };

    let revised = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      },
      relationships: {
        moons: {
          data: [{ type: 'moon', id: 'moon1' }]
        }
      }
    };

    return source.push(t => t.addRecord(original))
      .then(() => source.push(t => t.removeFromRelatedRecords(original, 'moons', { type: 'moon', id: 'moon2' })))
      .then(() => verifyLocalStorageContainsRecord(assert, source, revised));
  });

  test('#push - removeFromRelatedRecords - when base record does not exist', function(assert) {
    assert.expect(1);

    let revised = {
      type: 'planet',
      id: 'jupiter',
      relationships: {
        moons: {
          data: [
          ]
        }
      }
    };

    return source.push(t => t.removeFromRelatedRecords({ type: 'planet', id: 'jupiter' }, 'moons', { type: 'moon', id: 'moon2' }))
      .then(() => verifyLocalStorageDoesNotContainRecord(assert, source, revised));
  });

  test('#push - replaceRelatedRecords', function(assert) {
    assert.expect(1);

    let original = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      },
      relationships: {
        moons: {
          data: [
            { type: 'moon', id: 'moon1' }
          ]
        }
      }
    };

    let revised = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      },
      relationships: {
        moons: {
          data: [
            { type: 'moon', id: 'moon2' },
            { type: 'moon', id: 'moon3' }
          ]
        }
      }
    };

    return source.push(t => t.addRecord(original))
      .then(() => source.push(t => t.replaceRelatedRecords(original, 'moons', [{ type: 'moon', id: 'moon2' }, { type: 'moon', id: 'moon3' }])))
      .then(() => verifyLocalStorageContainsRecord(assert, source, revised));
  });

  test('#push - replaceRelatedRecords - when base record does not exist', function(assert) {
    assert.expect(1);

    let revised = {
      type: 'planet',
      id: 'jupiter',
      relationships: {
        moons: {
          data: [
            { type: 'moon', id: 'moon2' },
            { type: 'moon', id: 'moon3' }
          ]
        }
      }
    };

    return source.push(t => t.replaceRelatedRecords({ type: 'planet', id: 'jupiter' }, 'moons', [{ type: 'moon', id: 'moon2' }, { type: 'moon', id: 'moon3' }]))
      .then(() => verifyLocalStorageContainsRecord(assert, source, revised));
  });

  test('#push - replaceRelatedRecord - with record', function(assert) {
    assert.expect(1);

    let original = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      },
      relationships: {
        solarSystem: {
          data: null
        }
      }
    };

    let revised = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      },
      relationships: {
        solarSystem: {
          data: { type: 'solarSystem', id: 'ss1' }
        }
      }
    };

    return source.push(t => t.addRecord(original))
      .then(() => source.push(t => t.replaceRelatedRecord(original, 'solarSystem', { type: 'solarSystem', id: 'ss1' })))
      .then(() => verifyLocalStorageContainsRecord(assert, source, revised));
  });

  test('#push - replaceRelatedRecord - with record - when base record does not exist', function(assert) {
    assert.expect(1);

    let revised = {
      type: 'planet',
      id: 'jupiter',
      relationships: {
        solarSystem: {
          data: { type: 'solarSystem', id: 'ss1' }
        }
      }
    };

    return source.push(t => t.replaceRelatedRecord({ type: 'planet', id: 'jupiter' }, 'solarSystem', { type: 'solarSystem', id: 'ss1' }))
      .then(() => verifyLocalStorageContainsRecord(assert, source, revised));
  });

  test('#push - replaceRelatedRecord - with null', function(assert) {
    assert.expect(1);

    let original = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      },
      relationships: {
        solarSystem: {
          data: { type: 'solarSystem', id: 'ss1' }
        }
      }
    };

    let revised = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      },
      relationships: {
        solarSystem: {
          data: null
        }
      }
    };

    return source.push(t => t.addRecord(original))
      .then(() => source.push(t => t.replaceRelatedRecord(original, 'solarSystem', null)))
      .then(() => verifyLocalStorageContainsRecord(assert, source, revised));
  });

  test('#push - replaceRelatedRecord - with null - when base record does not exist', function(assert) {
    assert.expect(1);

    let revised = {
      type: 'planet',
      id: 'jupiter',
      relationships: {
        solarSystem: {
          data: null
        }
      }
    };

    return source.push(t => t.replaceRelatedRecord({ type: 'planet', id: 'jupiter' }, 'solarSystem', null))
      .then(() => verifyLocalStorageContainsRecord(assert, source, revised));
  });

  test('#reset - clears records for source', function(assert) {
    assert.expect(2);

    let planet = {
      type: 'planet',
      id: 'jupiter'
    };

    return source.push(t => t.addRecord(planet))
      .then(() => {
        verifyLocalStorageContainsRecord(assert, source, planet);
        return source.reset();
      })
      .then(() => verifyLocalStorageIsEmpty(assert, source));
  });

  test('#pull - all records', function(assert) {
    assert.expect(5);

    let earth = {
      type: 'planet',
      id: 'earth',
      keys: {
        remoteId: 'p1'
      },
      attributes: {
        name: 'Earth',
        classification: 'terrestrial'
      }
    };

    let jupiter = {
      type: 'planet',
      id: 'jupiter',
      keys: {
        remoteId: 'p2'
      },
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    };

    let io = {
      type: 'moon',
      id: 'io',
      keys: {
        remoteId: 'm1'
      },
      attributes: {
        name: 'Io'
      }
    };

    return source.reset()
      .then(() => source.push(t => [
        t.addRecord(earth),
        t.addRecord(jupiter),
        t.addRecord(io)
      ]))
      .then(() => {
        // reset keyMap to verify that pulling records also adds keys
        keyMap.reset();
      })
      .then(() => source.pull(q => q.findRecords()))
      .then(transforms => {
        assert.equal(transforms.length, 1, 'one transform returned');
        assert.deepEqual(
          transforms[0].operations.map(o => o.op),
          ['addRecord', 'addRecord', 'addRecord'],
          'operations match expectations'
        );
      })
      .then(() => {
        assert.equal(keyMap.keyToId('planet', 'remoteId', 'p1'), 'earth', 'key has been mapped');
        assert.equal(keyMap.keyToId('planet', 'remoteId', 'p2'), 'jupiter', 'key has been mapped');
        assert.equal(keyMap.keyToId('moon', 'remoteId', 'm1'), 'io', 'key has been mapped');
      });
  });

  test('#pull - records of one type', function(assert) {
    assert.expect(2);

    let earth = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial'
      }
    };

    let jupiter = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    };

    let io = {
      type: 'moon',
      id: 'io',
      attributes: {
        name: 'Io'
      }
    };

    return source.reset()
      .then(() => source.push(t => [
        t.addRecord(earth),
        t.addRecord(jupiter),
        t.addRecord(io)
      ]))
      .then(() => source.pull(q => q.findRecords('planet')))
      .then(transforms => {
        assert.equal(transforms.length, 1, 'one transform returned');
        assert.deepEqual(
          transforms[0].operations.map(o => o.op),
          ['addRecord', 'addRecord'],
          'operations match expectations'
        );
      });
  });

  test('#pull - a specific record', function(assert) {
    assert.expect(3);

    let earth = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial'
      }
    };

    let jupiter = {
      type: 'planet',
      id: 'jupiter',
      keys: {
        remoteId: 'p2'
      },
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    };

    let io = {
      type: 'moon',
      id: 'io',
      attributes: {
        name: 'Io'
      }
    };

    return source.reset()
      .then(() => source.push(t => [
        t.addRecord(earth),
        t.addRecord(jupiter),
        t.addRecord(io)
      ]))
      .then(() => {
        // reset keyMap to verify that pulling records also adds keys
        keyMap.reset();
      })
      .then(() => source.pull(q => q.findRecord(jupiter)))
      .then(transforms => {
        assert.equal(transforms.length, 1, 'one transform returned');
        assert.deepEqual(
          transforms[0].operations.map(o => o.op),
          ['addRecord'],
          'operations match expectations'
        );
      })
      .then(() => {
        assert.equal(keyMap.keyToId('planet', 'remoteId', 'p2'), 'jupiter', 'key has been mapped');
      });
   });
});
