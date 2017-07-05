import ImmutableMap from '../src/immutable-map';
import './test-helper';

const { module, test } = QUnit;

module('ImmutableMap', function() {
  test('it can be instantiated with no data', function(assert) {
    let map = new ImmutableMap<string, object>();
    assert.ok(map, 'map exists');
  });

  test('records can be added and removed', function(assert) {
    let map = new ImmutableMap<string, object>();

    assert.equal(map.has('jupiter'), false, 'map does not have record');
    assert.strictEqual(map.get('jupiter'), undefined, 'get returns undefined');

    let jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter' }};
    map.set('jupiter', jupiter);

    assert.equal(map.has('jupiter'), true, 'record exists');
    assert.strictEqual(map.get('jupiter'), jupiter, 'record matches expectations');

    let jupiter2 = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter2' }};
    map.set('jupiter', jupiter2);

    assert.strictEqual(map.get('jupiter'), jupiter2, 'replacement record matches expectations');

    let pluto = { type: 'planet', id: 'pluto', attributes: { name: 'Pluto' }};
    map.set('pluto', pluto);

    assert.deepEqual(Array.from(map.keys()), ['pluto', 'jupiter'], 'keys match expectations');
    assert.deepEqual(Array.from(map.values()), [pluto, jupiter2], 'values match expectations');
  });
});
