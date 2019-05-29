import KeyMap from '../src/key-map';
import './test-helper';

const { module, test } = QUnit;

module('KeyMap', function(hooks) {
  test('#pushRecord adds mappings; #keyToId and #idToKey access them', function(assert) {
    let keyMap = new KeyMap();

    keyMap.pushRecord({ type: 'planet', id: '1', keys: { remoteId: 'a' } });
    keyMap.pushRecord({ type: 'planet', id: '2', keys: { remoteId: 'b' } });
    keyMap.pushRecord({ type: 'moon', id: '1', keys: { remoteId: 'c' } });
    keyMap.pushRecord({ type: 'moon', id: '2', keys: { remoteId: 'a' } });
    keyMap.pushRecord({ type: 'planet', id: '3', keys: { anotherKey: 'd' } });

    assert.equal(keyMap.keyToId('moon', 'remoteId', 'c'), '1');
    assert.equal(keyMap.keyToId('planet', 'remoteId', 'a'), '1');
    assert.equal(keyMap.keyToId('planet', 'anotherKey', 'd'), '3');
    assert.equal(keyMap.keyToId('planet', 'remoteId', 'bogus'), undefined);

    assert.equal(keyMap.idToKey('planet', 'remoteId', '2'), 'b');
    assert.equal(keyMap.idToKey('moon', 'remoteId', '2'), 'a');
    assert.equal(keyMap.idToKey('planet', 'anotherKey', '3'), 'd');
    assert.equal(keyMap.idToKey('planet', 'remoteId', 'bogus'), undefined);
  });

  test('#reset clears mappings', function(assert) {
    let keyMap = new KeyMap();

    keyMap.pushRecord({ type: 'planet', id: '1', keys: { remoteId: 'a' } });

    assert.equal(keyMap.keyToId('planet', 'remoteId', 'a'), '1');
    assert.equal(keyMap.idToKey('planet', 'remoteId', '1'), 'a');

    keyMap.reset();

    assert.equal(keyMap.keyToId('planet', 'remoteId', 'a'), undefined);
    assert.equal(keyMap.idToKey('planet', 'remoteId', '1'), undefined);
  });

  test('#pushRecord does not set incomplete records', function(assert) {
    let keyMap = new KeyMap();

    keyMap.pushRecord({ type: 'planet', id: null, keys: { remoteId: 'a' } });
    assert.strictEqual(keyMap.keyToId('planet', 'remoteId', 'a'), undefined);

    keyMap.pushRecord({ type: 'planet', id: '1', keys: { remoteId: null } });
    assert.strictEqual(keyMap.idToKey('planet', 'remoteId', '1'), undefined);
  });

  test('#idFromKeys retrieves an id given a set of keys', function(assert) {
    let keyMap = new KeyMap();

    keyMap.pushRecord({ type: 'planet', id: '1', keys: { remoteId: 'a' } });

    let foundId = keyMap.idFromKeys('planet', { remoteId: 'a' });
    assert.equal(foundId, '1', 'Found previously pushed id');

    let missingId = keyMap.idFromKeys('planet', { remoteId: 'b' });
    assert.equal(
      missingId,
      undefined,
      'returns undefined when id cannot be found'
    );
  });
});
