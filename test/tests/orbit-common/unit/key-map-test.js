import Schema from 'orbit-common/schema';
import KeyMap from 'orbit-common/key-map';
import { uuid } from 'orbit/lib/uuid';

let schema;

module('OC - KeyMap', {
  beforeEach() {
    schema = new Schema({
      modelDefaults: {
        id: { defaultValue: uuid },
        keys: {
          remoteId: {}
        }
      },
      models: {
        planet: {},
        moon: {}
      }
    });
  }
});

test('#pushRecord', function() {
  let keyMap = new KeyMap(schema);

  keyMap.pushRecord({ type: 'planet', id: '1', keys: { remoteId: 'a' } });
  keyMap.pushRecord({ type: 'planet', id: '2', keys: { remoteId: 'b' } });
  keyMap.pushRecord({ type: 'moon', id: '1', keys: { remoteId: 'c' } });
  keyMap.pushRecord({ type: 'moon', id: '2', keys: { remoteId: 'a' } });

  equal(keyMap.keyToId('moon', 'remoteId', 'c'), '1');
  equal(keyMap.keyToId('planet', 'remoteId', 'a'), '1');
  equal(keyMap.keyToId('planet', 'remoteId', 'bogus'), undefined);

  equal(keyMap.idToKey('planet', 'remoteId', '2'), 'b');
  equal(keyMap.idToKey('moon', 'remoteId', '2'), 'a');
  equal(keyMap.idToKey('planet', 'remoteId', 'bogus'), undefined);
});

test('#findIdForRecord', function(assert) {
  let keyMap = new KeyMap(schema);

  keyMap.pushRecord({ type: 'planet', id: '1', keys: { remoteId: 'a' } });

  let foundId = keyMap.findIdForRecord({ type: 'planet', id: undefined, keys: { remoteId: 'a' } });
  assert.equal(foundId, '1', 'Found previously pushed id');

  let missingId = keyMap.findIdForRecord({ type: 'planet', id: undefined, keys: { remoteId: 'b' } });
  assert.equal(missingId, undefined, 'returns undefined when id cannot be found');
});

test('#pushDocument', function(assert) {
  let keyMap = new KeyMap(schema);

  keyMap.pushRecord({ type: 'planet', id: '1', keys: { remoteId: 'a' } });

  keyMap.pushDocument({
    planet: {
      '2': { id: '2', keys: { remoteId: 'b' } }
    },
    moon: {
      '3': { id: '3', keys: { remoteId: 'b' } }
    }
  });

  assert.equal(keyMap.keyToId('planet', 'remoteId', 'a'), '1', 'old key remains');
  assert.equal(keyMap.keyToId('planet', 'remoteId', 'b'), '2', 'new key on old type was registered');
  assert.equal(keyMap.keyToId('moon', 'remoteId', 'b'), '3', 'new key on new type was registered');
});
