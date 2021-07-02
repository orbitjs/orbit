import {
  RecordKeyMap,
  InitializedRecord,
  RecordNotFoundException,
  RecordSchema
} from '@orbit/records';
import { ExampleSyncRecordCache } from './support/example-sync-record-cache';
import { arrayMembershipMatches } from './support/matchers';
import { createSchemaWithRemoteKey } from './support/setup';

const { module, test } = QUnit;

module('SyncRecordCache - query', function (hooks) {
  let schema: RecordSchema, keyMap: RecordKeyMap;

  hooks.beforeEach(function () {
    schema = createSchemaWithRemoteKey();
    keyMap = new RecordKeyMap();
  });

  test('#query can retrieve an individual record', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };

    const updatedRecord = cache.update<InitializedRecord>((t) =>
      t.addRecord(jupiter)
    );

    const foundRecord = cache.query<InitializedRecord>((q) =>
      q.findRecord({ type: 'planet', id: 'jupiter' })
    );

    assert.strictEqual(updatedRecord, jupiter, 'updated record is correct');
    assert.strictEqual(foundRecord, jupiter, 'found record is correct');
  });

  test('#query can retrieve multiple expressions', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    cache.update((t) => [t.addRecord(jupiter), t.addRecord(earth)]);

    assert.deepEqual(
      cache.query((q) => [
        q.findRecord({ type: 'planet', id: 'jupiter' }),
        q.findRecord({ type: 'planet', id: 'earth' })
      ]),
      [jupiter, earth]
    );
  });

  test('#query can find records by type', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: InitializedRecord = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: InitializedRecord = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    cache.update((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    arrayMembershipMatches(
      assert,
      cache.query((q) => q.findRecords('planet')) as InitializedRecord[],
      [jupiter, earth, venus, mercury]
    );
  });

  test('#query can find records by identities', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: InitializedRecord = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: InitializedRecord = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    cache.update((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q.findRecords([
          { type: 'planet', id: 'jupiter' },
          { type: 'planet', id: 'venus' },
          { type: 'planet', id: 'FAKE' }
        ])
      ) as InitializedRecord[],
      [jupiter, venus]
    );
  });

  test('#query can perform a simple attribute filter by value equality', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: InitializedRecord = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: InitializedRecord = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    cache.update((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q.findRecords('planet').filter({ attribute: 'name', value: 'Jupiter' })
      ) as InitializedRecord[],
      [jupiter]
    );
  });

  test('#query can perform a simple attribute filter by value comparison (gt, lt, gte & lte)', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        sequence: 5,
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        sequence: 3,
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: InitializedRecord = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        sequence: 2,
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: InitializedRecord = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        sequence: 1,
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    cache.update((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ attribute: 'sequence', value: 2, op: 'gt' })
      ) as InitializedRecord[],
      [earth, jupiter]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ attribute: 'sequence', value: 2, op: 'gte' })
      ) as InitializedRecord[],
      [venus, earth, jupiter]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ attribute: 'sequence', value: 2, op: 'lt' })
      ) as InitializedRecord[],
      [mercury]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ attribute: 'sequence', value: 2, op: 'lte' })
      ) as InitializedRecord[],
      [venus, mercury]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter(
            { attribute: 'sequence', value: 2, op: 'gte' },
            { attribute: 'sequence', value: 4, op: 'lt' }
          )
      ) as InitializedRecord[],
      [venus, earth]
    );
  });

  test('#query can perform relatedRecords filters with operators `equal`, `all`, `some` and `none`', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        sequence: 5,
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: {
        moons: {
          data: [
            { type: 'moon', id: 'europa' },
            { type: 'moon', id: 'ganymede' },
            { type: 'moon', id: 'callisto' }
          ]
        }
      }
    };
    const earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        sequence: 3,
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { moons: { data: [{ type: 'moon', id: 'moon' }] } }
    };
    const mars: InitializedRecord = {
      type: 'planet',
      id: 'mars',
      attributes: {
        name: 'Mars',
        sequence: 4,
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: {
        moons: {
          data: [
            { type: 'moon', id: 'phobos' },
            { type: 'moon', id: 'deimos' }
          ]
        }
      }
    };
    const mercury: InitializedRecord = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        sequence: 1,
        classification: 'terrestrial',
        atmosphere: false
      }
    };
    const theMoon: InitializedRecord = {
      id: 'moon',
      type: 'moon',
      attributes: { name: 'The moon' },
      relationships: { planet: { data: { type: 'planet', id: 'earth' } } }
    };
    const europa: InitializedRecord = {
      id: 'europa',
      type: 'moon',
      attributes: { name: 'Europa' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    const ganymede: InitializedRecord = {
      id: 'ganymede',
      type: 'moon',
      attributes: { name: 'Ganymede' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    const callisto: InitializedRecord = {
      id: 'callisto',
      type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    const phobos: InitializedRecord = {
      id: 'phobos',
      type: 'moon',
      attributes: { name: 'Phobos' },
      relationships: { planet: { data: { type: 'planet', id: 'mars' } } }
    };
    const deimos: InitializedRecord = {
      id: 'deimos',
      type: 'moon',
      attributes: { name: 'Deimos' },
      relationships: { planet: { data: { type: 'planet', id: 'mars' } } }
    };
    const titan: InitializedRecord = {
      id: 'titan',
      type: 'moon',
      attributes: { name: 'titan' },
      relationships: {}
    };

    cache.update((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(mars),
      t.addRecord(mercury),
      t.addRecord(theMoon),
      t.addRecord(europa),
      t.addRecord(ganymede),
      t.addRecord(callisto),
      t.addRecord(phobos),
      t.addRecord(deimos),
      t.addRecord(titan)
    ]);
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ relation: 'moons', records: [theMoon], op: 'equal' })
      ) as InitializedRecord[],
      [earth]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ relation: 'moons', records: [phobos], op: 'equal' })
      ) as InitializedRecord[],
      []
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ relation: 'moons', records: [phobos], op: 'all' })
      ) as InitializedRecord[],
      [mars]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ relation: 'moons', records: [phobos, callisto], op: 'all' })
      ) as InitializedRecord[],
      []
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q.findRecords('planet').filter({
          relation: 'moons',
          records: [phobos, callisto],
          op: 'some'
        })
      ) as InitializedRecord[],
      [mars, jupiter]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ relation: 'moons', records: [titan], op: 'some' })
      ) as InitializedRecord[],
      []
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ relation: 'moons', records: [ganymede], op: 'none' })
      ) as InitializedRecord[],
      [earth, mars]
    );
  });

  test('#query can perform relatedRecord filters', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        sequence: 5,
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: {
        moons: {
          data: [
            { type: 'moon', id: 'europa' },
            { type: 'moon', id: 'ganymede' },
            { type: 'moon', id: 'callisto' }
          ]
        }
      }
    };
    const earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        sequence: 3,
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { moons: { data: [{ type: 'moon', id: 'moon' }] } }
    };
    const mars: InitializedRecord = {
      type: 'planet',
      id: 'mars',
      attributes: {
        name: 'Mars',
        sequence: 4,
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: {
        moons: {
          data: [
            { type: 'moon', id: 'phobos' },
            { type: 'moon', id: 'deimos' }
          ]
        }
      }
    };
    const mercury: InitializedRecord = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        sequence: 1,
        classification: 'terrestrial',
        atmosphere: false
      }
    };
    const theMoon: InitializedRecord = {
      id: 'moon',
      type: 'moon',
      attributes: { name: 'The moon' },
      relationships: { planet: { data: { type: 'planet', id: 'earth' } } }
    };
    const europa: InitializedRecord = {
      id: 'europa',
      type: 'moon',
      attributes: { name: 'Europa' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    const ganymede: InitializedRecord = {
      id: 'ganymede',
      type: 'moon',
      attributes: { name: 'Ganymede' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    const callisto: InitializedRecord = {
      id: 'callisto',
      type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    const phobos: InitializedRecord = {
      id: 'phobos',
      type: 'moon',
      attributes: { name: 'Phobos' },
      relationships: { planet: { data: { type: 'planet', id: 'mars' } } }
    };
    const deimos: InitializedRecord = {
      id: 'deimos',
      type: 'moon',
      attributes: { name: 'Deimos' },
      relationships: { planet: { data: { type: 'planet', id: 'mars' } } }
    };
    const titan: InitializedRecord = {
      id: 'titan',
      type: 'moon',
      attributes: { name: 'titan' },
      relationships: { planet: { data: null } }
    };

    cache.update((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(mars),
      t.addRecord(mercury),
      t.addRecord(theMoon),
      t.addRecord(europa),
      t.addRecord(ganymede),
      t.addRecord(callisto),
      t.addRecord(phobos),
      t.addRecord(deimos),
      t.addRecord(titan)
    ]);
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q.findRecords('moon').filter({ relation: 'planet', record: null })
      ) as InitializedRecord[],
      [titan]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q.findRecords('moon').filter({ relation: 'planet', record: earth })
      ) as InitializedRecord[],
      [theMoon]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q.findRecords('moon').filter({ relation: 'planet', record: jupiter })
      ) as InitializedRecord[],
      [europa, ganymede, callisto]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q.findRecords('moon').filter({ relation: 'planet', record: mercury })
      ) as InitializedRecord[],
      []
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('moon')
          .filter({ relation: 'planet', record: [earth, mars] })
      ) as InitializedRecord[],
      [theMoon, phobos, deimos]
    );
  });

  test('#query can perform a complex attribute filter by value', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: InitializedRecord = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: InitializedRecord = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    cache.update((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter(
            { attribute: 'atmosphere', value: true },
            { attribute: 'classification', value: 'terrestrial' }
          )
      ) as InitializedRecord[],
      [earth, venus]
    );
  });

  test('#query can perform a filter on attributes, even when a particular record has none', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: InitializedRecord = { type: 'planet', id: 'jupiter' };
    const earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: InitializedRecord = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: InitializedRecord = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    cache.update((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter(
            { attribute: 'atmosphere', value: true },
            { attribute: 'classification', value: 'terrestrial' }
          )
      ) as InitializedRecord[],
      [earth, venus]
    );
  });

  test('#query can sort by an attribute', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: InitializedRecord = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: InitializedRecord = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    cache.update((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      cache.query((q) => q.findRecords('planet').sort('name')),
      [earth, jupiter, mercury, venus]
    );
  });

  test('#query can sort by an attribute, even when a particular record has none', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: InitializedRecord = { type: 'planet', id: 'jupiter' };
    const earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: InitializedRecord = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: InitializedRecord = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    cache.update((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      cache.query((q) => q.findRecords('planet').sort('name')),
      [earth, mercury, venus, jupiter]
    );
  });

  test('#query can filter and sort by attributes', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: InitializedRecord = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: InitializedRecord = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    cache.update((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter(
            { attribute: 'atmosphere', value: true },
            { attribute: 'classification', value: 'terrestrial' }
          )
          .sort('name')
      ),
      [earth, venus]
    );
  });

  test('#query can sort by an attribute in descending order', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: InitializedRecord = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: InitializedRecord = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    cache.update((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      cache.query((q) => q.findRecords('planet').sort('-name')),
      [venus, mercury, jupiter, earth]
    );
  });

  test('#query can sort by according to multiple criteria', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: InitializedRecord = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: InitializedRecord = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    cache.update((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      cache.query((q) =>
        q.findRecords('planet').sort('classification', 'name')
      ),
      [jupiter, earth, mercury, venus]
    );
  });

  test('#query - findRecord - finds record', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: InitializedRecord = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: [{ type: 'moon', id: 'callisto' }] } }
    };

    cache.update((t) => [t.addRecord(jupiter)]);

    assert.deepEqual(
      cache.query((q) => q.findRecord({ type: 'planet', id: 'jupiter' })),
      jupiter
    );
  });

  test("#query - findRecord - returns undefined if record doesn't exist", function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    assert.equal(
      cache.query((q) => q.findRecord({ type: 'planet', id: 'jupiter' })),
      undefined
    );
  });

  test("#query - findRecord - throws RecordNotFoundException if record doesn't exist with `raiseNotFoundExceptions` option", function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    assert.throws(
      () =>
        cache.query((q) =>
          q.findRecord({ type: 'planet', id: 'jupiter' }).options({
            raiseNotFoundExceptions: true
          })
        ),
      RecordNotFoundException
    );
  });

  test('#query - findRecords - finds matching records', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: InitializedRecord = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: [{ type: 'moon', id: 'callisto' }] } }
    };

    const callisto: InitializedRecord = {
      id: 'callisto',
      type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };

    cache.update((t) => [t.addRecord(jupiter), t.addRecord(callisto)]);

    assert.deepEqual(
      cache.query((q) => q.findRecords('planet')),
      [jupiter]
    );
  });

  test('#query - page - can paginate records by offset and limit', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: InitializedRecord = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    };

    const earth: InitializedRecord = {
      id: 'earth',
      type: 'planet',
      attributes: { name: 'Earth' }
    };

    const venus: InitializedRecord = {
      id: 'venus',
      type: 'planet',
      attributes: { name: 'Venus' }
    };

    const mars: InitializedRecord = {
      id: 'mars',
      type: 'planet',
      attributes: { name: 'Mars' }
    };

    cache.update((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mars)
    ]);

    assert.deepEqual(
      cache.query((q) => q.findRecords('planet').sort('name')),
      [earth, jupiter, mars, venus]
    );

    assert.deepEqual(
      cache.query((q) =>
        q.findRecords('planet').sort('name').page({ limit: 3 })
      ),
      [earth, jupiter, mars]
    );

    assert.deepEqual(
      cache.query((q) =>
        q.findRecords('planet').sort('name').page({ offset: 1, limit: 2 })
      ),
      [jupiter, mars]
    );
  });

  test('#query - findRelatedRecords', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: InitializedRecord = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: [{ type: 'moon', id: 'callisto' }] } }
    };

    const callisto: InitializedRecord = {
      id: 'callisto',
      type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };

    cache.update((t) => [t.addRecord(jupiter), t.addRecord(callisto)]);

    assert.deepEqual(
      cache.query((q) =>
        q.findRelatedRecords({ type: 'planet', id: 'jupiter' }, 'moons')
      ),
      [callisto]
    );
  });

  test('#query - findRelatedRecords - returns empty array if there are no related records', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: InitializedRecord = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    };

    cache.update((t) => [t.addRecord(jupiter)]);

    assert.deepEqual(
      cache.query((q) =>
        q.findRelatedRecords({ type: 'planet', id: 'jupiter' }, 'moons')
      ),
      []
    );
  });

  test("#query - findRelatedRecords - returns undefined if primary record doesn't exist", function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    assert.equal(
      cache.query((q) =>
        q.findRelatedRecords({ type: 'planet', id: 'jupiter' }, 'moons')
      ),
      undefined
    );
  });

  test("#query - findRelatedRecords - throws RecordNotFoundException if primary record doesn't exist with `raiseNotFoundExceptions` option", function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    assert.throws(
      () =>
        cache.query((q) =>
          q
            .findRelatedRecords({ type: 'planet', id: 'jupiter' }, 'moons')
            .options({
              raiseNotFoundExceptions: true
            })
        ),
      RecordNotFoundException
    );
  });

  test('#query - findRelatedRecord', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: InitializedRecord = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: [{ type: 'moon', id: 'callisto' }] } }
    };

    const callisto: InitializedRecord = {
      id: 'callisto',
      type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };

    cache.update((t) => [t.addRecord(jupiter), t.addRecord(callisto)]);

    assert.deepEqual(
      cache.query((q) =>
        q.findRelatedRecord({ type: 'moon', id: 'callisto' }, 'planet')
      ),
      jupiter
    );
  });

  test('#query - findRelatedRecord - return null if no related record is found', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const callisto: InitializedRecord = {
      id: 'callisto',
      type: 'moon',
      attributes: { name: 'Callisto' }
    };

    cache.update((t) => [t.addRecord(callisto)]);

    assert.deepEqual(
      cache.query((q) =>
        q.findRelatedRecord({ type: 'moon', id: 'callisto' }, 'planet')
      ),
      null
    );
  });

  test("#query - findRelatedRecord - returns undefined if primary record doesn't exist", function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    assert.equal(
      cache.query((q) =>
        q.findRelatedRecord({ type: 'moon', id: 'callisto' }, 'planet')
      ),
      undefined
    );
  });

  test("#query - findRelatedRecord - throws RecordNotFoundException if primary record doesn't exist with `raiseNotFoundExceptions` option", function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    assert.throws(
      () =>
        cache.query((q) =>
          q
            .findRelatedRecord({ type: 'moon', id: 'callisto' }, 'planet')
            .options({
              raiseNotFoundExceptions: true
            })
        ),
      RecordNotFoundException
    );
  });

  test('#query - findRelatedRecords can perform a simple attribute filter by value equality', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const sun: InitializedRecord = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'venus' },
            { type: 'planet', id: 'mercury' }
          ]
        }
      }
    };

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const venus: InitializedRecord = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const mercury: InitializedRecord = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    cache.update((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ attribute: 'name', value: 'Jupiter' })
      ) as InitializedRecord[],
      [jupiter]
    );
  });

  test('#query - findRelatedRecords - can perform a simple attribute filter by value comparison (gt, lt, gte & lte)', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const sun: InitializedRecord = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'venus' },
            { type: 'planet', id: 'mercury' }
          ]
        }
      }
    };

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        sequence: 5,
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        sequence: 3,
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const venus: InitializedRecord = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        sequence: 2,
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const mercury: InitializedRecord = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        sequence: 1,
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    cache.update((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ attribute: 'sequence', value: 2, op: 'gt' })
      ) as InitializedRecord[],
      [earth, jupiter]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ attribute: 'sequence', value: 2, op: 'gte' })
      ) as InitializedRecord[],
      [venus, earth, jupiter]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ attribute: 'sequence', value: 2, op: 'lt' })
      ) as InitializedRecord[],
      [mercury]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ attribute: 'sequence', value: 2, op: 'lte' })
      ) as InitializedRecord[],
      [venus, mercury]
    );
  });

  test('#query - findRelatedRecords - can perform relatedRecords filters with operators `equal`, `all`, `some` and `none`', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const sun: InitializedRecord = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'mars' },
            { type: 'planet', id: 'mercury' }
          ]
        }
      }
    };

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        sequence: 5,
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: {
        star: { data: { type: 'star', id: 'sun' } },
        moons: {
          data: [
            { type: 'moon', id: 'europa' },
            { type: 'moon', id: 'ganymede' },
            { type: 'moon', id: 'callisto' }
          ]
        }
      }
    };
    const earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        sequence: 3,
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: {
        star: { data: { type: 'star', id: 'sun' } },
        moons: { data: [{ type: 'moon', id: 'moon' }] }
      }
    };
    const mars: InitializedRecord = {
      type: 'planet',
      id: 'mars',
      attributes: {
        name: 'Mars',
        sequence: 4,
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: {
        star: { data: { type: 'star', id: 'sun' } },
        moons: {
          data: [
            { type: 'moon', id: 'phobos' },
            { type: 'moon', id: 'deimos' }
          ]
        }
      }
    };
    const mercury: InitializedRecord = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        sequence: 1,
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const theMoon: InitializedRecord = {
      id: 'moon',
      type: 'moon',
      attributes: { name: 'The moon' },
      relationships: { planet: { data: { type: 'planet', id: 'earth' } } }
    };
    const europa: InitializedRecord = {
      id: 'europa',
      type: 'moon',
      attributes: { name: 'Europa' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    const ganymede: InitializedRecord = {
      id: 'ganymede',
      type: 'moon',
      attributes: { name: 'Ganymede' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    const callisto: InitializedRecord = {
      id: 'callisto',
      type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    const phobos: InitializedRecord = {
      id: 'phobos',
      type: 'moon',
      attributes: { name: 'Phobos' },
      relationships: { planet: { data: { type: 'planet', id: 'mars' } } }
    };
    const deimos: InitializedRecord = {
      id: 'deimos',
      type: 'moon',
      attributes: { name: 'Deimos' },
      relationships: { planet: { data: { type: 'planet', id: 'mars' } } }
    };
    const titan: InitializedRecord = {
      id: 'titan',
      type: 'moon',
      attributes: { name: 'titan' },
      relationships: {}
    };

    cache.update((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(mars),
      t.addRecord(mercury),
      t.addRecord(theMoon),
      t.addRecord(europa),
      t.addRecord(ganymede),
      t.addRecord(callisto),
      t.addRecord(phobos),
      t.addRecord(deimos),
      t.addRecord(titan)
    ]);
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ relation: 'moons', records: [theMoon], op: 'equal' })
      ) as InitializedRecord[],
      [earth]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ relation: 'moons', records: [phobos], op: 'equal' })
      ) as InitializedRecord[],
      []
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ relation: 'moons', records: [phobos], op: 'all' })
      ) as InitializedRecord[],
      [mars]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ relation: 'moons', records: [phobos, callisto], op: 'all' })
      ) as InitializedRecord[],
      []
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q.findRelatedRecords(sun, 'celestialObjects').filter({
          relation: 'moons',
          records: [phobos, callisto],
          op: 'some'
        })
      ) as InitializedRecord[],
      [mars, jupiter]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ relation: 'moons', records: [titan], op: 'some' })
      ) as InitializedRecord[],
      []
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ relation: 'moons', records: [ganymede], op: 'none' })
      ) as InitializedRecord[],
      [earth, mars]
    );
  });

  test('#query - findRelatedRecords - can perform relatedRecord filters', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const sun: InitializedRecord = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'mars' },
            { type: 'planet', id: 'mercury' },
            { type: 'moon', id: 'moon' },
            { type: 'moon', id: 'europa' },
            { type: 'moon', id: 'ganymede' },
            { type: 'moon', id: 'callisto' },
            { type: 'moon', id: 'phobos' },
            { type: 'moon', id: 'deimos' },
            { type: 'moon', id: 'titan' }
          ]
        }
      }
    };

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        sequence: 5,
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: {
        star: { data: { type: 'star', id: 'sun' } },
        moons: {
          data: [
            { type: 'moon', id: 'europa' },
            { type: 'moon', id: 'ganymede' },
            { type: 'moon', id: 'callisto' }
          ]
        }
      }
    };
    const earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        sequence: 3,
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: {
        star: { data: { type: 'star', id: 'sun' } },
        moons: { data: [{ type: 'moon', id: 'moon' }] }
      }
    };
    const mars: InitializedRecord = {
      type: 'planet',
      id: 'mars',
      attributes: {
        name: 'Mars',
        sequence: 4,
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: {
        star: { data: { type: 'star', id: 'sun' } },
        moons: {
          data: [
            { type: 'moon', id: 'phobos' },
            { type: 'moon', id: 'deimos' }
          ]
        }
      }
    };
    const mercury: InitializedRecord = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        sequence: 1,
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const theMoon: InitializedRecord = {
      id: 'moon',
      type: 'moon',
      attributes: { name: 'The moon' },
      relationships: {
        planet: { data: { type: 'planet', id: 'earth' } },
        star: { data: { type: 'star', id: 'sun' } }
      }
    };
    const europa: InitializedRecord = {
      id: 'europa',
      type: 'moon',
      attributes: { name: 'Europa' },
      relationships: {
        planet: { data: { type: 'planet', id: 'jupiter' } },
        star: { data: { type: 'star', id: 'sun' } }
      }
    };
    const ganymede: InitializedRecord = {
      id: 'ganymede',
      type: 'moon',
      attributes: { name: 'Ganymede' },
      relationships: {
        planet: { data: { type: 'planet', id: 'jupiter' } },
        star: { data: { type: 'star', id: 'sun' } }
      }
    };
    const callisto: InitializedRecord = {
      id: 'callisto',
      type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: {
        planet: { data: { type: 'planet', id: 'jupiter' } },
        star: { data: { type: 'star', id: 'sun' } }
      }
    };
    const phobos: InitializedRecord = {
      id: 'phobos',
      type: 'moon',
      attributes: { name: 'Phobos' },
      relationships: {
        planet: { data: { type: 'planet', id: 'mars' } },
        star: { data: { type: 'star', id: 'sun' } }
      }
    };
    const deimos: InitializedRecord = {
      id: 'deimos',
      type: 'moon',
      attributes: { name: 'Deimos' },
      relationships: {
        planet: { data: { type: 'planet', id: 'mars' } },
        star: { data: { type: 'star', id: 'sun' } }
      }
    };
    const titan: InitializedRecord = {
      id: 'titan',
      type: 'moon',
      attributes: { name: 'titan' },
      relationships: {
        planet: { data: null },
        star: { data: { type: 'star', id: 'sun' } }
      }
    };

    cache.update((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(mars),
      t.addRecord(mercury),
      t.addRecord(theMoon),
      t.addRecord(europa),
      t.addRecord(ganymede),
      t.addRecord(callisto),
      t.addRecord(phobos),
      t.addRecord(deimos),
      t.addRecord(titan)
    ]);
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ relation: 'planet', record: null })
      ) as InitializedRecord[],
      [titan]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(earth, 'moons')
          .filter({ relation: 'planet', record: earth })
      ) as InitializedRecord[],
      [theMoon]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(jupiter, 'moons')
          .filter({ relation: 'planet', record: jupiter })
      ) as InitializedRecord[],
      [europa, ganymede, callisto]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(mercury, 'moons')
          .filter({ relation: 'planet', record: mercury })
      ) as InitializedRecord[],
      []
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ relation: 'planet', record: [earth, mars] })
      ) as InitializedRecord[],
      [theMoon, phobos, deimos]
    );
  });

  test('#query - findRelatedRecords - can perform a complex attribute filter by value', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const sun: InitializedRecord = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'venus' },
            { type: 'planet', id: 'mercury' }
          ]
        }
      }
    };

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const venus: InitializedRecord = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const mercury: InitializedRecord = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    cache.update((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter(
            { attribute: 'atmosphere', value: true },
            { attribute: 'classification', value: 'terrestrial' }
          )
      ) as InitializedRecord[],
      [earth, venus]
    );
  });

  test('#query - findRelatedRecords - can perform a filter on attributes, even when a particular record has none', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const sun: InitializedRecord = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'venus' },
            { type: 'planet', id: 'mercury' }
          ]
        }
      }
    };

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const venus: InitializedRecord = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const mercury: InitializedRecord = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    cache.update((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter(
            { attribute: 'atmosphere', value: true },
            { attribute: 'classification', value: 'terrestrial' }
          )
      ) as InitializedRecord[],
      [earth, venus]
    );
  });

  test('#query - findRelatedRecords - can sort by an attribute', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const sun: InitializedRecord = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'venus' },
            { type: 'planet', id: 'mercury' }
          ]
        }
      }
    };

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const venus: InitializedRecord = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const mercury: InitializedRecord = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    cache.update((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      cache.query((q) =>
        q.findRelatedRecords(sun, 'celestialObjects').sort('name')
      ),
      [earth, jupiter, mercury, venus]
    );
  });

  test('#query - findRelatedRecords - can sort by an attribute, even when a particular record has none', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const sun: InitializedRecord = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'venus' },
            { type: 'planet', id: 'mercury' }
          ]
        }
      }
    };

    const jupiter: InitializedRecord = { type: 'planet', id: 'jupiter' };
    const earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const venus: InitializedRecord = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const mercury: InitializedRecord = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    cache.update((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      cache.query((q) =>
        q.findRelatedRecords(sun, 'celestialObjects').sort('name')
      ),
      [earth, mercury, venus, jupiter]
    );
  });

  test('#query - findRelatedRecords - can filter and sort by attributes', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const sun: InitializedRecord = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'venus' },
            { type: 'planet', id: 'mercury' }
          ]
        }
      }
    };

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const venus: InitializedRecord = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const mercury: InitializedRecord = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    cache.update((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter(
            { attribute: 'atmosphere', value: true },
            { attribute: 'classification', value: 'terrestrial' }
          )
          .sort('name')
      ),
      [earth, venus]
    );
  });

  test('#query - findRelatedRecords - can sort by an attribute in descending order', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const sun: InitializedRecord = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'venus' },
            { type: 'planet', id: 'mercury' }
          ]
        }
      }
    };

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const venus: InitializedRecord = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const mercury: InitializedRecord = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    cache.update((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      cache.query((q) =>
        q.findRelatedRecords(sun, 'celestialObjects').sort('-name')
      ),
      [venus, mercury, jupiter, earth]
    );
  });

  test('#query - findRelatedRecords - can sort by according to multiple criteria', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const sun: InitializedRecord = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'venus' },
            { type: 'planet', id: 'mercury' }
          ]
        }
      }
    };

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const venus: InitializedRecord = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const mercury: InitializedRecord = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    cache.update((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .sort('classification', 'name')
      ),
      [jupiter, earth, mercury, venus]
    );
  });

  test('#query - findRelatedRecords - page - can paginate records by offset and limit', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const sun: InitializedRecord = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'venus' },
            { type: 'planet', id: 'mars' }
          ]
        }
      }
    };

    const jupiter: InitializedRecord = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    const earth = {
      id: 'earth',
      type: 'planet',
      attributes: { name: 'Earth' },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    const venus = {
      id: 'venus',
      type: 'planet',
      attributes: { name: 'Venus' },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    const mars = {
      id: 'mars',
      type: 'planet',
      attributes: { name: 'Mars' },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    cache.update((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mars)
    ]);

    assert.deepEqual(
      cache.query((q) =>
        q.findRelatedRecords(sun, 'celestialObjects').sort('name')
      ),
      [earth, jupiter, mars, venus]
    );

    assert.deepEqual(
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .sort('name')
          .page({ limit: 3 })
      ),
      [earth, jupiter, mars]
    );

    assert.deepEqual(
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .sort('name')
          .page({ offset: 1, limit: 2 })
      ),
      [jupiter, mars]
    );
  });

  test('#liveQuery', async function (assert) {
    let cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: InitializedRecord = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    };

    const jupiter2 = {
      ...jupiter,
      attributes: { name: 'Jupiter 2' }
    };

    const callisto: InitializedRecord = {
      id: 'callisto',
      type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };

    const jupiterWithCallisto = {
      ...jupiter2,
      relationships: { moons: { data: [{ type: 'moon', id: 'callisto' }] } }
    };

    const livePlanet = cache.liveQuery((q) =>
      q.findRecord({ type: 'planet', id: 'jupiter' })
    );
    const livePlanets = cache.liveQuery((q) => q.findRecords('planet'));
    const livePlanetMoons = cache.liveQuery((q) =>
      q.findRelatedRecords(jupiter, 'moons')
    );
    const liveMoonPlanet = cache.liveQuery((q) =>
      q.findRelatedRecord(callisto, 'planet')
    );

    interface Deferred {
      promise?: Promise<any>;
      resolve?: (...args: any[]) => void;
      reject?: (message: string) => void;
    }
    function defer(): Deferred {
      let defer: Deferred = {};
      defer.promise = new Promise((resolve, reject) => {
        defer.resolve = resolve;
        defer.reject = (message) => reject(new Error(message));
      });
      return defer;
    }

    let jupiterAdded = defer();
    let jupiterUpdated = defer();
    let callistoAdded = defer();
    let jupiterRemoved = defer();

    function next() {
      if (n === 1 && i === 1 && j === 0 && k === 0) {
        jupiterAdded.resolve?.();
      }
      if (n === 2 && i === 2 && j === 0 && k === 0) {
        jupiterUpdated.resolve?.();
      }
      if (n === 3 && i === 3 && j === 1 && k === 1) {
        callistoAdded.resolve?.();
      }
      if (n === 4 && i === 4 && j === 2 && k === 2) {
        jupiterRemoved.resolve?.();
      }
    }

    let n = 0;
    let livePlanetUnsubscribe = livePlanet.subscribe((update) => {
      n++;
      try {
        const result = update.query();

        if (n === 1) {
          assert.deepEqual(result, jupiter, 'findRecord jupiter');
        } else if (n === 2) {
          assert.deepEqual(result, jupiter2, 'findRecord jupiter2');
        } else if (n === 3) {
          assert.deepEqual(
            result,
            jupiterWithCallisto,
            'findRecord jupiterWithCallisto'
          );
        } else if (n === 4) {
          assert.strictEqual(result, undefined, 'findRecord undefined');
        } else {
          assert.ok(false, 'findRecord should not execute');
        }
      } catch (error) {
        assert.ok(false, 'findRecord should not throw error');
      }

      next();
    });

    let i = 0;
    let livePlanetsUnsubscribe = livePlanets.subscribe((update) => {
      i++;
      try {
        const result = update.query();

        if (i === 1) {
          assert.deepEqual(result, [jupiter], 'findRecords [jupiter]');
        } else if (i === 2) {
          assert.deepEqual(result, [jupiter2], 'findRecords [jupiter2]');
        } else if (i === 3) {
          assert.deepEqual(
            result,
            [jupiterWithCallisto],
            'findRecords [jupiterWithCallisto]'
          );
        } else if (i === 4) {
          assert.deepEqual(result, [], 'findRecords []');
        } else {
          assert.ok(false, 'findRecords should not execute');
        }
      } catch (e) {
        assert.ok(false, 'findRecords should not throw error');
      }
      next();
    });

    let j = 0;
    let livePlanetMoonsUnsubscribe = livePlanetMoons.subscribe((update) => {
      j++;
      try {
        const result = update.query();

        if (j === 1) {
          assert.deepEqual(
            result,
            [callisto],
            'findRelatedRecords jupiter.moons => [callisto]'
          );
        } else if (j === 2) {
          assert.strictEqual(result, undefined, 'findRelatedRecords undefined');
        } else {
          assert.ok(false, 'findRelatedRecords should not execute');
        }
      } catch (error) {
        assert.ok(false, 'findRelatedRecords should not throw error');
      }
      next();
    });

    let k = 0;
    let liveMoonPlanetUnsubscribe = liveMoonPlanet.subscribe((update) => {
      k++;
      try {
        const result = update.query();

        if (k === 1) {
          assert.deepEqual(
            result,
            jupiterWithCallisto,
            'findRelatedRecord callisto.planet => jupiter'
          );
        } else if (k === 2) {
          assert.deepEqual(
            result,
            null,
            'findRelatedRecord callisto.planet => null'
          );
        } else {
          assert.ok(false, 'findRelatedRecord should not execute');
        }
      } catch (e) {
        assert.ok(false, 'findRelatedRecord should not throw error');
      }
      next();
    });

    setTimeout(() => {
      jupiterAdded.reject?.('reject jupiterAdded');
      jupiterUpdated.reject?.('reject jupiterUpdated');
      callistoAdded.reject?.('reject callistoAdded');
      jupiterRemoved.reject?.('reject jupiterRemoved');
    }, 500);

    cache.update((t) => t.addRecord(jupiter));
    await jupiterAdded.promise;

    cache.update((t) => t.updateRecord(jupiter2));
    await jupiterUpdated.promise;

    cache.update((t) => t.addRecord(callisto));
    await callistoAdded.promise;

    cache.update((t) => t.removeRecord(jupiter));
    await jupiterRemoved.promise;

    assert.expect(16);
    assert.equal(n, 4, 'findRecord should run 4 times');
    assert.equal(i, 4, 'findRecords should run 4 times');
    assert.equal(j, 2, 'findRelatedRecords should run 2 times');
    assert.equal(k, 2, 'findRelatedRecord should run 2 times');

    livePlanetUnsubscribe();
    livePlanetsUnsubscribe();
    livePlanetMoonsUnsubscribe();
    liveMoonPlanetUnsubscribe();

    cache.update((t) =>
      t.addRecord({
        type: 'planet',
        id: 'mercury',
        attributes: {
          name: 'Mercury'
        }
      })
    );
  });

  test('#liveQuery findRecords (debounce)', async function (assert) {
    let cache = new ExampleSyncRecordCache({ schema, keyMap });

    const planets: InitializedRecord[] = [
      {
        id: 'planet1',
        type: 'planet',
        attributes: { name: 'Planet 1' }
      },
      {
        id: 'planet2',
        type: 'planet',
        attributes: { name: 'Planet 2' }
      },
      {
        id: 'planet3',
        type: 'planet',
        attributes: { name: 'Planet 3' }
      }
    ];

    const livePlanets = cache.liveQuery((q) => q.findRecords('planet'));

    let i = 0;
    cache.on('patch', () => i++);

    const done = assert.async();
    livePlanets.subscribe((update) => {
      const result = update.query();
      assert.deepEqual(result, planets);
      assert.equal(i, 3);
      done();
    });

    cache.update((t) => planets.map((planet) => t.addRecord(planet)));
    assert.expect(2);
  });

  test('#liveQuery findRecords (no debounce)', async function (assert) {
    let cache = new ExampleSyncRecordCache({
      schema,
      keyMap,
      debounceLiveQueries: false
    });

    const planets: InitializedRecord[] = [
      {
        id: 'planet1',
        type: 'planet',
        attributes: { name: 'Planet 1' }
      },
      {
        id: 'planet2',
        type: 'planet',
        attributes: { name: 'Planet 2' }
      },
      {
        id: 'planet3',
        type: 'planet',
        attributes: { name: 'Planet 3' }
      }
    ];

    const livePlanets = cache.liveQuery((q) => q.findRecords('planet'));

    let i = 0;
    cache.on('patch', () => i++);

    const done = assert.async();
    livePlanets.subscribe((update) => {
      const result = update.query() as InitializedRecord[];
      assert.equal(result.length, i);

      if (i === 3) {
        done();
      }
    });

    cache.update((t) => planets.map((planet) => t.addRecord(planet)));
    assert.expect(3);
  });

  test('#liveQuery can apply attribute filters', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        sequence: 5,
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        sequence: 3,
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: InitializedRecord = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        sequence: 2,
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: InitializedRecord = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        sequence: 1,
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    const livePlanets = cache.liveQuery((q) =>
      q
        .findRecords('planet')
        .filter(
          { attribute: 'sequence', value: 2, op: 'gte' },
          { attribute: 'sequence', value: 4, op: 'lt' }
        )
    );

    const done = assert.async();
    livePlanets.subscribe((update) => {
      const result = update.query() as InitializedRecord[];
      arrayMembershipMatches(assert, result, [venus, earth]);
      done();
    });

    // liveQuery results are initially empty
    arrayMembershipMatches(
      assert,
      livePlanets.query() as InitializedRecord[],
      []
    );

    // adding records should update liveQuery results
    cache.update((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);
  });
});
