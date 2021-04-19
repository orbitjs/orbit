import {
  cloneRecordIdentity,
  dedupeRecordIdentities,
  deserializeRecordIdentity,
  equalRecordIdentities,
  equalRecordIdentitySets,
  isRecordIdentity,
  mergeRecords,
  recordsInclude,
  recordsIncludeAll,
  serializeRecordIdentity,
  uniqueRecordIdentities
} from '../src/record';

const { module, test } = QUnit;

module('Record', function () {
  test('`cloneRecordIdentity` returns a simple { type, id } identity object from any object with a `type` and `id`', function (assert) {
    assert.deepEqual(cloneRecordIdentity({ type: 'planet', id: '1' }), {
      type: 'planet',
      id: '1'
    });
  });

  test('`isRecordIdentity` distinguishes between a RecordIdentity and a RecordKeyValue', function (assert) {
    assert.ok(isRecordIdentity({ type: 'planet', id: '1' }));
    assert.notOk(isRecordIdentity({ type: 'planet' }));
    assert.notOk(isRecordIdentity({ type: 'planet', id: null }));
    assert.notOk(isRecordIdentity({ type: 'planet', id: 1 }));
    assert.notOk(
      isRecordIdentity({ type: 'planet', key: 'remoteId', value: '1' })
    );
  });

  test('`serializeRecordIdentity` - serializes type:id of a record into a string', function (assert) {
    assert.equal(
      serializeRecordIdentity({ type: 'planet', id: '1' }),
      'planet:1'
    );
  });

  test('`deserializeRecordIdentity` - deserializes type:id string into an identity object', function (assert) {
    assert.deepEqual(deserializeRecordIdentity('planet:1'), {
      type: 'planet',
      id: '1'
    });
  });

  test('`equalRecordIdentities` compares the type/id identity of two objects', function (assert) {
    assert.ok(
      equalRecordIdentities(
        { type: 'planet', id: '1' },
        { type: 'planet', id: '1' }
      ),
      'identities match'
    );
    assert.ok(equalRecordIdentities(null, null), 'identities match');
    assert.ok(
      !equalRecordIdentities(
        { type: 'planet', id: '1' },
        { type: 'moon', id: '1' }
      ),
      'identities do not match'
    );
    assert.ok(
      !equalRecordIdentities({ type: 'planet', id: '1' }, null),
      'identities do not match'
    );
    assert.ok(
      !equalRecordIdentities(null, { type: 'planet', id: '1' }),
      'identities do not match'
    );
  });

  test('`equalRecordIdentitySets` compares the membership of two arrays of identity objects', function (assert) {
    assert.ok(equalRecordIdentitySets([], []), 'empty sets are equal');
    assert.ok(
      equalRecordIdentitySets(
        [{ type: 'planet', id: 'p1' }],
        [{ type: 'planet', id: 'p1' }]
      ),
      'equal sets with one member'
    );
    assert.ok(
      equalRecordIdentitySets(
        [
          { type: 'planet', id: 'p1' },
          { type: 'moon', id: 'm1' }
        ],
        [
          { type: 'moon', id: 'm1' },
          { type: 'planet', id: 'p1' }
        ]
      ),
      'equal sets with two members out of order'
    );
    assert.notOk(
      equalRecordIdentitySets(
        [
          { type: 'planet', id: 'p1' },
          { type: 'moon', id: 'm1' }
        ],
        [{ type: 'moon', id: 'm1' }]
      ),
      'unequal sets 1'
    );
    assert.notOk(
      equalRecordIdentitySets(
        [{ type: 'planet', id: 'p1' }],
        [
          { type: 'moon', id: 'm1' },
          { type: 'planet', id: 'p1' }
        ]
      ),
      'unequal sets 2'
    );
  });

  test('`uniqueRecordIdentities` returns the identities in the first set that are not in the second', function (assert) {
    assert.deepEqual(
      uniqueRecordIdentities([], []),
      [],
      'empty sets are equal'
    );
    assert.deepEqual(
      uniqueRecordIdentities(
        [{ type: 'planet', id: 'p1' }],
        [{ type: 'planet', id: 'p1' }]
      ),
      [],
      'equal sets with one member'
    );
    assert.deepEqual(
      uniqueRecordIdentities(
        [
          { type: 'planet', id: 'p1' },
          { type: 'moon', id: 'm1' }
        ],
        [
          { type: 'moon', id: 'm1' },
          { type: 'planet', id: 'p1' }
        ]
      ),
      [],
      'equal sets with two members out of order'
    );
    assert.deepEqual(
      uniqueRecordIdentities(
        [
          { type: 'planet', id: 'p1' },
          { type: 'moon', id: 'm1' }
        ],
        [{ type: 'moon', id: 'm1' }]
      ),
      [{ type: 'planet', id: 'p1' }],
      'unequal sets 1'
    );
    assert.deepEqual(
      uniqueRecordIdentities(
        [{ type: 'planet', id: 'p1' }],
        [
          { type: 'moon', id: 'm1' },
          { type: 'planet', id: 'p1' }
        ]
      ),
      [],
      'unequal sets 2'
    );
  });

  test('`dedupeRecordIdentities` returns a deduped array of record identities', function (assert) {
    assert.deepEqual(dedupeRecordIdentities([]), [], 'empty sets are equal');
    assert.deepEqual(
      dedupeRecordIdentities([{ type: 'planet', id: 'p1' }]),
      [{ type: 'planet', id: 'p1' }],
      'equal sets with one member'
    );
    assert.deepEqual(
      dedupeRecordIdentities([
        { type: 'moon', id: 'm1' },
        { type: 'planet', id: 'p1' },
        { type: 'moon', id: 'm1' },
        { type: 'moon', id: 'm2' },
        { type: 'planet', id: 'p1' }
      ]),
      [
        { type: 'moon', id: 'm1' },
        { type: 'planet', id: 'p1' },
        { type: 'moon', id: 'm2' }
      ],
      'equal sets with two members out of order'
    );
  });

  test('`recordsInclude` checks for the presence of an identity in an array of records', function (assert) {
    assert.notOk(recordsInclude([], { type: 'planet', id: 'p1' }), 'empty set');
    assert.ok(
      recordsInclude([{ type: 'planet', id: 'p1' }], {
        type: 'planet',
        id: 'p1'
      }),
      'set with one member'
    );
    assert.ok(
      recordsInclude(
        [
          { type: 'planet', id: 'p1' },
          { type: 'moon', id: 'm1' }
        ],
        { type: 'moon', id: 'm1' }
      ),
      'set with two members'
    );
    assert.notOk(
      recordsInclude(
        [
          { type: 'planet', id: 'p1' },
          { type: 'moon', id: 'm1' }
        ],
        { type: 'foo', id: 'bar' }
      ),
      'set with two members and no matches'
    );
  });

  test('`recordsIncludeAll` checks for the presence of all identities in an array of records', function (assert) {
    assert.ok(recordsIncludeAll([], []), 'empty sets are equal');
    assert.ok(
      recordsIncludeAll(
        [{ type: 'planet', id: 'p1' }],
        [{ type: 'planet', id: 'p1' }]
      ),
      'equal sets with one member'
    );
    assert.ok(
      recordsIncludeAll(
        [
          { type: 'planet', id: 'p1' },
          { type: 'moon', id: 'm1' }
        ],
        [
          { type: 'moon', id: 'm1' },
          { type: 'planet', id: 'p1' }
        ]
      ),
      'equal sets with two members out of order'
    );
    assert.ok(
      recordsIncludeAll(
        [
          { type: 'planet', id: 'p1' },
          { type: 'moon', id: 'm1' }
        ],
        [{ type: 'moon', id: 'm1' }]
      ),
      'unequal sets 1'
    );
    assert.notOk(
      recordsIncludeAll(
        [{ type: 'planet', id: 'p1' }],
        [
          { type: 'moon', id: 'm1' },
          { type: 'planet', id: 'p1' }
        ]
      ),
      'unequal sets 2'
    );
  });

  test('`mergeRecords` returns a clone of the updates if no current record is supplied', function (assert) {
    let earth = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth'
      }
    };
    assert.deepEqual(mergeRecords(null, earth), earth);
    assert.notStrictEqual(mergeRecords(null, earth), earth);
  });

  test('`mergeRecords` merges individual attributes and keys', function (assert) {
    let earth = {
      type: 'planet',
      id: 'earth',
      keys: {
        primaryId: 'a',
        secondaryId: 'b'
      },
      attributes: {
        name: 'Earth',
        circumference: 25000
      }
    };

    let updates = {
      type: 'planet',
      id: 'earth',
      keys: {
        secondaryId: 'c',
        tertiaryId: 'd'
      },
      attributes: {
        name: 'Mother Earth',
        description: 'Home'
      }
    };

    let expected = {
      type: 'planet',
      id: 'earth',
      keys: {
        primaryId: 'a',
        secondaryId: 'c',
        tertiaryId: 'd'
      },
      attributes: {
        name: 'Mother Earth',
        description: 'Home',
        circumference: 25000
      }
    };

    assert.deepEqual(mergeRecords(earth, updates), expected);
  });

  test("`mergeRecords` adds meta and links objects if they don't previously exist", function (assert) {
    let earth = {
      type: 'planet',
      id: 'earth'
    };

    let updates = {
      type: 'planet',
      id: 'earth',
      meta: {
        bar: 'baz'
      },
      links: {
        self: 'http://example.com/planets/earth',
        next: 'http://example.com/planets/mars'
      }
    };

    let expected = {
      type: 'planet',
      id: 'earth',
      meta: {
        bar: 'baz'
      },
      links: {
        self: 'http://example.com/planets/earth',
        next: 'http://example.com/planets/mars'
      }
    };

    assert.deepEqual(mergeRecords(earth, updates), expected);
  });

  test('`mergeRecords` carries forward meta and links objects if they exist', function (assert) {
    let earth = {
      type: 'planet',
      id: 'earth',
      meta: {
        bar: 'baz'
      },
      links: {
        self: 'http://example.com/planets/earth',
        next: 'http://example.com/planets/mars'
      }
    };

    let updates = {
      type: 'planet',
      id: 'earth'
    };

    let expected = {
      type: 'planet',
      id: 'earth',
      meta: {
        bar: 'baz'
      },
      links: {
        self: 'http://example.com/planets/earth',
        next: 'http://example.com/planets/mars'
      }
    };

    assert.deepEqual(mergeRecords(earth, updates), expected);
  });

  test('`mergeRecords` replaces existing meta and links objects completely', function (assert) {
    let earth = {
      type: 'planet',
      id: 'earth',
      meta: {
        foo: 'bar'
      },
      links: {
        self: 'http://example.com/planets/earth',
        previous: 'http://example.com/planets/venus'
      }
    };

    let updates = {
      type: 'planet',
      id: 'earth',
      meta: {
        bar: 'baz'
      },
      links: {
        self: 'http://example.com/planets/earth',
        next: 'http://example.com/planets/mars'
      }
    };

    let expected = {
      type: 'planet',
      id: 'earth',
      meta: {
        bar: 'baz'
      },
      links: {
        self: 'http://example.com/planets/earth',
        next: 'http://example.com/planets/mars'
      }
    };

    assert.deepEqual(mergeRecords(earth, updates), expected);
  });

  test('`mergeRecords` handles meta, links, and data within relationships separately', function (assert) {
    let earth = {
      type: 'planet',
      id: 'earth',
      relationships: {
        moons: {
          meta: {
            foo: 'bar'
          },
          links: {
            self: 'http://example.com/planets/earth',
            previous: 'http://example.com/planets/venus'
          }
        },
        sun: {
          meta: {
            foo: 'bar'
          }
        },
        inhabitants: {
          data: [
            {
              type: 'person',
              id: '1'
            }
          ]
        }
      }
    };

    let updates = {
      type: 'planet',
      id: 'earth',
      relationships: {
        moons: {
          meta: {
            bar: 'baz'
          },
          links: {
            self: 'http://example.com/planets/earth/relationships/moons',
            related: 'http://example.com/planets/earth/moons'
          }
        },
        inhabitants: {
          meta: {
            bar: 'baz'
          },
          links: {
            self: 'http://example.com/planets/earth/relationships/inhabitants',
            related: 'http://example.com/planets/earth/inhabitants'
          }
        },
        elements: {
          links: {
            self: 'http://example.com/planets/earth/relationships/elements',
            related: 'http://example.com/planets/earth/elements'
          }
        }
      }
    };

    let expected = {
      type: 'planet',
      id: 'earth',
      relationships: {
        inhabitants: {
          meta: {
            bar: 'baz'
          },
          links: {
            self: 'http://example.com/planets/earth/relationships/inhabitants',
            related: 'http://example.com/planets/earth/inhabitants'
          },
          data: [
            {
              type: 'person',
              id: '1'
            }
          ]
        },
        moons: {
          meta: {
            bar: 'baz'
          },
          links: {
            self: 'http://example.com/planets/earth/relationships/moons',
            related: 'http://example.com/planets/earth/moons'
          }
        },
        sun: {
          meta: {
            foo: 'bar'
          }
        },
        elements: {
          links: {
            self: 'http://example.com/planets/earth/relationships/elements',
            related: 'http://example.com/planets/earth/elements'
          }
        }
      }
    };

    assert.deepEqual(mergeRecords(earth, updates), expected);
  });
});
