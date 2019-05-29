import {
  cloneRecordIdentity,
  equalRecordIdentities,
  equalRecordIdentitySets,
  uniqueRecordIdentities,
  recordsInclude,
  recordsIncludeAll,
  deserializeRecordIdentity,
  serializeRecordIdentity
} from '../src/index';
import './test-helper';

const { module, test } = QUnit;

module('Record', function() {
  test('`cloneRecordIdentity` returns a simple { type, id } identity object from any object with a `type` and `id`', function(assert) {
    assert.deepEqual(cloneRecordIdentity({ type: 'planet', id: '1' }), {
      type: 'planet',
      id: '1'
    });
  });

  test('`serializeRecordIdentity` - serializes type:id of a record into a string', function(assert) {
    assert.equal(
      serializeRecordIdentity({ type: 'planet', id: '1' }),
      'planet:1'
    );
  });

  test('`deserializeRecordIdentity` - deserializes type:id string into an identity object', function(assert) {
    assert.deepEqual(deserializeRecordIdentity('planet:1'), {
      type: 'planet',
      id: '1'
    });
  });

  test('`equalRecordIdentities` compares the type/id identity of two objects', function(assert) {
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

  test('`equalRecordIdentitySets` compares the membership of two arrays of identity objects', function(assert) {
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
        [{ type: 'planet', id: 'p1' }, { type: 'moon', id: 'm1' }],
        [{ type: 'moon', id: 'm1' }, { type: 'planet', id: 'p1' }]
      ),
      'equal sets with two members out of order'
    );
    assert.notOk(
      equalRecordIdentitySets(
        [{ type: 'planet', id: 'p1' }, { type: 'moon', id: 'm1' }],
        [{ type: 'moon', id: 'm1' }]
      ),
      'unequal sets 1'
    );
    assert.notOk(
      equalRecordIdentitySets(
        [{ type: 'planet', id: 'p1' }],
        [{ type: 'moon', id: 'm1' }, { type: 'planet', id: 'p1' }]
      ),
      'unequal sets 2'
    );
  });

  test('`uniqueRecordIdentities` returns the identities in the first set that are not in the second', function(assert) {
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
        [{ type: 'planet', id: 'p1' }, { type: 'moon', id: 'm1' }],
        [{ type: 'moon', id: 'm1' }, { type: 'planet', id: 'p1' }]
      ),
      [],
      'equal sets with two members out of order'
    );
    assert.deepEqual(
      uniqueRecordIdentities(
        [{ type: 'planet', id: 'p1' }, { type: 'moon', id: 'm1' }],
        [{ type: 'moon', id: 'm1' }]
      ),
      [{ type: 'planet', id: 'p1' }],
      'unequal sets 1'
    );
    assert.deepEqual(
      uniqueRecordIdentities(
        [{ type: 'planet', id: 'p1' }],
        [{ type: 'moon', id: 'm1' }, { type: 'planet', id: 'p1' }]
      ),
      [],
      'unequal sets 2'
    );
  });

  test('`recordsInclude` checks for the presence of an identity in an array of records', function(assert) {
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
        [{ type: 'planet', id: 'p1' }, { type: 'moon', id: 'm1' }],
        { type: 'moon', id: 'm1' }
      ),
      'set with two members'
    );
    assert.notOk(
      recordsInclude(
        [{ type: 'planet', id: 'p1' }, { type: 'moon', id: 'm1' }],
        { type: 'foo', id: 'bar' }
      ),
      'set with two members and no matches'
    );
  });

  test('`recordsIncludeAll` checks for the presence of all identities in an array of records', function(assert) {
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
        [{ type: 'planet', id: 'p1' }, { type: 'moon', id: 'm1' }],
        [{ type: 'moon', id: 'm1' }, { type: 'planet', id: 'p1' }]
      ),
      'equal sets with two members out of order'
    );
    assert.ok(
      recordsIncludeAll(
        [{ type: 'planet', id: 'p1' }, { type: 'moon', id: 'm1' }],
        [{ type: 'moon', id: 'm1' }]
      ),
      'unequal sets 1'
    );
    assert.notOk(
      recordsIncludeAll(
        [{ type: 'planet', id: 'p1' }],
        [{ type: 'moon', id: 'm1' }, { type: 'planet', id: 'p1' }]
      ),
      'unequal sets 2'
    );
  });
});
