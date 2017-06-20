import {
  verifyIndexedDBContainsRecord,
  verifyIndexedDBDoesNotContainRecord
} from './support/indexeddb';
import {
  Transform,
  Schema,
  Source
} from '@orbit/data';
import IndexedDBSource from '../src/source';
import './test-helper';

const { module, test } = QUnit;

module('IndexedDBSource', function(hooks) {
  let schema, source;

  hooks.beforeEach(() => {
    schema = new Schema({
      models: {
        planet: {},
        moon: {}
      }
    });

    source = new IndexedDBSource({ schema });
  });

  hooks.afterEach(() => {
    return source.deleteDB();
  });

  test('it exists', function(assert) {
    assert.ok(source);
  });

  test('is assigned a default dbName', function(assert) {
    assert.equal(source.dbName, 'orbit', '`dbName` is `orbit` by default');
  });

  test('will reopen the database when the schema is upgraded', function(assert) {
    const done = assert.async();

    assert.expect(5);

    assert.equal(source.dbVersion, 1, 'db starts with version == 1');

    source.migrateDB = function(db, event) {
      assert.equal(event.oldVersion, 1, 'migrateDB called with oldVersion == 1');
      assert.equal(event.newVersion, 2, 'migrateDB called with newVersion == 2');
      done();
    };

    schema.on('upgrade', (version) => {
      assert.equal(version, 2, 'schema has upgraded to v2');
      assert.equal(source.dbVersion, 2, 'db has the correct version');
    });

    source.openDB()
      .then(() => {
        schema.upgrade({
          models: {
            planet: {
              attributes: {
                name: { type: 'string' }
              }
            },
            moon: {
              attributes: {
                name: { type: 'string' }
              }
            }
          }
        });
      });
  });

  test('#reset is idempotent', async function(assert) {
    return source.openDB()
      .then(() => source.reset())
      .then(() => source.reset())
      .then(() => source.openDB())
      .then(() => {
        assert.ok(true, 'db has been reset twice and can still be reopened');
      });
  });

  test('#push - addRecord', function(assert) {
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
      .then(() => verifyIndexedDBContainsRecord(assert, source, planet));
  });

  test('#push - replaceRecord', function(assert) {
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
        revised: true
      }
    };

    return source.push(t => t.addRecord(original))
      .then(() => source.push(t => t.replaceRecord(revised)))
      .then(() => verifyIndexedDBContainsRecord(assert, source, revised));
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
      .then(() => verifyIndexedDBDoesNotContainRecord(assert, source, planet));
  });

  test('#push - replaceKey', function(assert) {
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
        classification: 'gas giant'
      },
      keys: {
        remoteId: '123'
      }
    };

    return source.push(t => t.addRecord(original))
      .then(() => source.push(t => t.replaceKey(original, 'remoteId', '123')))
      .then(() => verifyIndexedDBContainsRecord(assert, source, revised));
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
      .then(() => verifyIndexedDBContainsRecord(assert, source, revised));
  });

  test('#push - addToHasMany', function(assert) {
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
          data: {}
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
          data: {
            'moon:moon1': true
          }
        }
      }
    };

    return source.push(t => t.addRecord(original))
      .then(() => source.push(t => t.addToHasMany(original, 'moons', { type: 'moon', id: 'moon1' })))
      .then(() => verifyIndexedDBContainsRecord(assert, source, revised));
  });

  test('#push - removeFromHasMany', function(assert) {
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
          data: {
            'moon:moon1': true,
            'moon:moon2': true
          }
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
          data: {
            'moon:moon1': true
          }
        }
      }
    };

    return source.push(t => t.addRecord(original))
      .then(() => source.push(t => t.removeFromHasMany(original, 'moons', { type: 'moon', id: 'moon2' })))
      .then(() => verifyIndexedDBContainsRecord(assert, source, revised));
  });

  test('#push - replaceHasMany', function(assert) {
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
          data: {
            'moon:moon1': true
          }
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
          data: {
            'moon:moon2': true,
            'moon:moon3': true
          }
        }
      }
    };

    return source.push(t => t.addRecord(original))
      .then(() => source.push(t => t.replaceHasMany(original, 'moons', [{ type: 'moon', id: 'moon2' }, { type: 'moon', id: 'moon3' }])))
      .then(() => verifyIndexedDBContainsRecord(assert, source, revised));
  });

  test('#push - replaceHasOne - record', function(assert) {
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
          data: 'solarSystem:ss1'
        }
      }
    };

    return source.push(t => t.addRecord(original))
      .then(() => source.push(t => t.replaceHasOne(original, 'solarSystem', { type: 'solarSystem', id: 'ss1' })))
      .then(() => verifyIndexedDBContainsRecord(assert, source, revised));
  });

  test('#push - replaceHasOne - null', function(assert) {
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
          data: 'solarSystem:ss1'
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
      .then(() => source.push(t => t.replaceHasOne(original, 'solarSystem', null)))
      .then(() => verifyIndexedDBContainsRecord(assert, source, revised));
  });

  test('#pull - all records', function(assert) {
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

    return source.push(t => [
      t.addRecord(earth),
      t.addRecord(jupiter),
      t.addRecord(io)
    ])
      .then(() => source.pull(q => q.findRecords()))
      .then(transforms => {
        assert.equal(transforms.length, 1, 'one transform returned');
        assert.deepEqual(
          transforms[0].operations.map(o => o.op),
          ['addRecord', 'addRecord', 'addRecord'],
          'operations match expectations'
        );
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

    return source.push(t => [
      t.addRecord(earth),
      t.addRecord(jupiter),
      t.addRecord(io)
    ])
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

    return source.clearRecords('planet')
      .then(() => source.clearRecords('moon'))
      .then(() => {
        return source.push(t => [
          t.addRecord(earth),
          t.addRecord(jupiter),
          t.addRecord(io)
        ]);
      })
      .then(() => source.pull(q => q.findRecord(jupiter)))
      .then(transforms => {
        assert.equal(transforms.length, 1, 'one transform returned');
        assert.deepEqual(
          transforms[0].operations.map(o => o.op),
          ['addRecord'],
          'operations match expectations'
        );
      });
  });
});
