import Schema from '../src/schema';
import KeyMap from '../src/key-map';
import { uuid } from '../src/utils/uuid';

const { module, test } = QUnit;

module('KeyMap', function(hooks) {
  let schema;

  hooks.beforeEach(function() {
    schema = new Schema({
      modelDefaults: {
        id: { defaultValue: uuid },
        keys: {
          remoteId: {},
          anotherKey: {}
        }
      },
      models: {
        planet: {},
        moon: {}
      }
    });
  });

  test('#pushRecord', function(assert) {
    let keyMap = new KeyMap(schema);

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

  test('#findIdForRecord', function(assert) {
    let keyMap = new KeyMap(schema);

    keyMap.pushRecord({ type: 'planet', id: '1', keys: { remoteId: 'a' } });

    let foundId = keyMap.findIdForRecord({ type: 'planet', id: undefined, keys: { remoteId: 'a' } });
    assert.equal(foundId, '1', 'Found previously pushed id');

    let missingId = keyMap.findIdForRecord({ type: 'planet', id: undefined, keys: { remoteId: 'b' } });
    assert.equal(missingId, undefined, 'returns undefined when id cannot be found');
  });
});
