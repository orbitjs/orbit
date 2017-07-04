import {
  cloneRecordIdentity
} from '@orbit/data';
import RecordIdentityMap from '../../src/cache/record-identity-map';
import '../test-helper';

const { module, test } = QUnit;

module('RecordIdentityMap', function(hooks) {
  test('can be created', function(assert) {
    let map = new RecordIdentityMap();
    assert.ok(map, 'created successfully');
  });

  test('identities can be added, removed, and checked', function(assert) {
    const europa = { type: 'moon', id: 'europa' };
    const io = { type: 'moon', id: 'io' };

    let map = new RecordIdentityMap();

    assert.equal(map.has(europa), false, 'europa not added');
    map.add(europa);
    assert.equal(map.has(europa), true, 'europa added');

    assert.equal(map.has(io), false, 'io not added');
    map.add(io);
    assert.equal(map.has(europa), true, 'io added');

    map.remove(io);
    assert.equal(map.has(io), false, 'io has been removed');

    assert.deepEqual(map.values, [europa], 'map.values returns all identities');

    map.remove(europa);
    assert.equal(map.has(europa), false, 'europa has been removed');

    assert.deepEqual(map.values, [], 'map.values returns all identities');
  });

  test('can be created from a base map', function(assert) {
    const europa = { type: 'moon', id: 'europa' };

    let base = new RecordIdentityMap();
    base.add(europa);

    let map = new RecordIdentityMap(base);
    assert.deepEqual(map.values, [europa], 'map.values returns all identities');

    map.remove(europa);

    assert.deepEqual(map.values, [], 'new map has been modified');
    assert.deepEqual(base.values, [europa], 'base map has not been modified');
  });

  test('can identify unique records and detect equal maps', function(assert) {
    const a = { type: 'moon', id: 'a' };
    const b = { type: 'moon', id: 'b' };
    const c = { type: 'moon', id: 'c' };
    const d = { type: 'moon', id: 'd' };

    let map1 = new RecordIdentityMap();
    map1.add(a);
    map1.add(b);
    map1.add(c);

    let map2 = new RecordIdentityMap();
    map2.add(b);
    map2.add(c);
    map2.add(d);

    assert.deepEqual(map1.exclusiveOf(map2), [a], 'exclusiveOf returns entries not in another map');
    assert.deepEqual(map2.exclusiveOf(map1), [d], 'exclusiveOf returns entries not in another map');
    assert.equal(map1.equals(map2), false, 'maps are not equal');
    assert.equal(map2.equals(map1), false, 'maps are not equal');

    map1.remove(a);
    map2.remove(d);

    assert.deepEqual(map1.exclusiveOf(map2), [], 'exclusiveOf returns entries not in another map');
    assert.deepEqual(map2.exclusiveOf(map1), [], 'exclusiveOf returns entries not in another map');

    assert.equal(map1.equals(map2), true, 'maps are equal');
    assert.equal(map2.equals(map1), true, 'maps are equal');
  });
});
