import { ImmutableMap } from '../src/immutable-map';

const { module, test } = QUnit;

module('ImmutableMap', function () {
  test('it can be instantiated with no data', function (assert) {
    let map = new ImmutableMap<string, any>();
    assert.ok(map, 'map exists');
  });

  test('records can be added and removed', function (assert) {
    let map = new ImmutableMap<string, any>();

    assert.equal(map.size, 0, 'size matches expectations');

    assert.equal(map.has('jupiter'), false, 'map does not have record');
    assert.strictEqual(map.get('jupiter'), undefined, 'get returns undefined');

    let jupiter = {
      type: 'planet',
      id: 'jupiter',
      attributes: { name: 'Jupiter' }
    };
    map.set('jupiter', jupiter);

    assert.equal(map.has('jupiter'), true, 'record exists');
    assert.strictEqual(
      map.get('jupiter'),
      jupiter,
      'record matches expectations'
    );

    let jupiter2 = {
      type: 'planet',
      id: 'jupiter',
      attributes: { name: 'Jupiter2' }
    };
    map.set('jupiter', jupiter2);

    assert.strictEqual(
      map.get('jupiter'),
      jupiter2,
      'replacement record matches expectations'
    );

    let pluto = { type: 'planet', id: 'pluto', attributes: { name: 'Pluto' } };
    map.set('pluto', pluto);

    assert.equal(map.size, 2, 'size matches expectations');
    assert.deepEqual(
      Array.from(map.keys()),
      ['pluto', 'jupiter'],
      'keys match expectations'
    );
    assert.deepEqual(
      Array.from(map.values()),
      [pluto, jupiter2],
      'values match expectations'
    );
    assert.deepEqual(
      Array.from(map.entries()),
      [
        ['pluto', pluto],
        ['jupiter', jupiter2]
      ],
      'entries match expectations'
    );

    map.remove('jupiter');
    map.remove('pluto');

    assert.equal(map.size, 0, 'size matches expectations');
  });

  test('maps can be instantiated based on other maps and their contents will be equal (but then will diverge)', function (assert) {
    let map = new ImmutableMap<string, any>();

    let jupiter = {
      type: 'planet',
      id: 'jupiter',
      attributes: { name: 'Jupiter' }
    };
    map.set('jupiter', jupiter);

    assert.strictEqual(
      map.get('jupiter'),
      jupiter,
      'record matches expectations'
    );

    // create a new map based on the original
    let map2 = new ImmutableMap<string, any>(map);

    assert.strictEqual(
      map2.get('jupiter'),
      jupiter,
      'record matches expectations'
    );

    let jupiter2 = {
      type: 'planet',
      id: 'jupiter',
      attributes: { name: 'Jupiter2' }
    };
    map2.set('jupiter', jupiter2);

    let pluto = { type: 'planet', id: 'pluto', attributes: { name: 'Pluto' } };
    map2.set('pluto', pluto);

    assert.equal(map.size, 1, 'original map still has one member');
    assert.strictEqual(
      map.get('jupiter'),
      jupiter,
      'original map is unchanged'
    );

    assert.equal(map2.size, 2, 'new map now has two members');
    assert.strictEqual(
      map2.get('jupiter'),
      jupiter2,
      'replacement record matches expectations'
    );
    assert.strictEqual(
      map2.get('pluto'),
      pluto,
      'new record matches expectations'
    );

    map2.remove('jupiter');
    map2.remove('pluto');

    assert.equal(map2.size, 0, 'size matches expectations');

    assert.equal(map.size, 1, 'original map still has one member');
    assert.strictEqual(
      map.get('jupiter'),
      jupiter,
      'original map is unchanged'
    );
  });

  test('maps can set and remove multiple items at once', function (assert) {
    let jupiter = {
      type: 'planet',
      id: 'jupiter',
      attributes: { name: 'Jupiter' }
    };
    let jupiter2 = {
      type: 'planet',
      id: 'jupiter',
      attributes: { name: 'Jupiter2' }
    };
    let pluto = { type: 'planet', id: 'pluto', attributes: { name: 'Pluto' } };
    let earth = { type: 'planet', id: 'earth', attributes: { name: 'Earth' } };

    let map = new ImmutableMap<string, any>();
    map.setMany([
      ['jupiter', jupiter],
      ['jupiter', jupiter2],
      ['pluto', pluto],
      ['earth', earth]
    ]);

    assert.equal(map.size, 3, 'map has three members');
    assert.strictEqual(
      map.get('jupiter'),
      jupiter2,
      'jupiter has been updated'
    );
    assert.strictEqual(map.get('pluto'), pluto, 'pluto is set');
    assert.strictEqual(map.get('earth'), earth, 'earth is set');

    map.removeMany(['jupiter', 'earth']);
    assert.equal(map.size, 1, 'map has one members');
    assert.strictEqual(map.get('pluto'), pluto, 'pluto is set');

    map.clear();

    assert.equal(map.size, 0, 'map has been cleared');
  });
});
