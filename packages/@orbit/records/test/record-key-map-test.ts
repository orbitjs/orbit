import { RecordKeyMap } from '../src/record-key-map';

const { module, test } = QUnit;

module('KeyMap', function (hooks) {
  test('#pushRecord adds mappings; #keyToId and #idToKey access them', function (assert) {
    let keyMap = new RecordKeyMap();

    keyMap.pushRecord({ type: 'planet', id: '1', keys: { remoteId: 'a' } });
    keyMap.pushRecord({ type: 'planet', id: '2', keys: { remoteId: 'b' } });
    keyMap.pushRecord({ type: 'moon', id: '1', keys: { remoteId: 'c' } });
    keyMap.pushRecord({ type: 'moon', id: '2', keys: { remoteId: 'a' } });
    keyMap.pushRecord({ type: 'planet', id: '3', keys: { anotherKey: 'd' } });

    assert.strictEqual(keyMap.keyToId('moon', 'remoteId', 'c'), '1');
    assert.strictEqual(keyMap.keyToId('planet', 'remoteId', 'a'), '1');
    assert.strictEqual(keyMap.keyToId('planet', 'anotherKey', 'd'), '3');
    assert.strictEqual(
      keyMap.keyToId('planet', 'remoteId', 'bogus'),
      undefined
    );

    assert.strictEqual(keyMap.idToKey('planet', 'remoteId', '2'), 'b');
    assert.strictEqual(keyMap.idToKey('moon', 'remoteId', '2'), 'a');
    assert.strictEqual(keyMap.idToKey('planet', 'anotherKey', '3'), 'd');
    assert.strictEqual(
      keyMap.idToKey('planet', 'remoteId', 'bogus'),
      undefined
    );
  });

  test('#reset clears mappings', function (assert) {
    let keyMap = new RecordKeyMap();

    keyMap.pushRecord({ type: 'planet', id: '1', keys: { remoteId: 'a' } });

    assert.strictEqual(keyMap.keyToId('planet', 'remoteId', 'a'), '1');
    assert.strictEqual(keyMap.idToKey('planet', 'remoteId', '1'), 'a');

    keyMap.reset();

    assert.strictEqual(keyMap.keyToId('planet', 'remoteId', 'a'), undefined);
    assert.strictEqual(keyMap.idToKey('planet', 'remoteId', '1'), undefined);
  });

  test('#pushRecord does not set incomplete records', function (assert) {
    let keyMap = new RecordKeyMap();

    keyMap.pushRecord({ type: 'planet', keys: { remoteId: 'a' } });
    assert.strictEqual(keyMap.keyToId('planet', 'remoteId', 'a'), undefined);

    keyMap.pushRecord({
      type: 'planet',
      id: '1'
    });
    assert.strictEqual(keyMap.idToKey('planet', 'remoteId', '1'), undefined);
  });

  test('#idFromKeys retrieves an id given a set of keys', function (assert) {
    let keyMap = new RecordKeyMap();

    keyMap.pushRecord({ type: 'planet', id: '1', keys: { remoteId: 'a' } });

    let foundId = keyMap.idFromKeys('planet', { remoteId: 'a' });
    assert.strictEqual(foundId, '1', 'Found previously pushed id');

    let missingId = keyMap.idFromKeys('planet', { remoteId: 'b' });
    assert.strictEqual(
      missingId,
      undefined,
      'returns undefined when id cannot be found'
    );
  });
});
