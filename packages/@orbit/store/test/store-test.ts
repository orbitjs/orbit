import { Schema, Source } from '@orbit/data';
import Store from '../src/index';

const { module, test } = QUnit;

module('Store', function(hooks) {
  let schema;
  let store;

  hooks.beforeEach(function() {
    schema = new Schema({
      models: {
        planet: {}
      }
    });
    store = new Store({ schema });
  });

  hooks.afterEach(function() {
    schema = null;
    store = null;
  });

  test('its prototype chain is correct', function(assert) {
    assert.ok(store instanceof Source, 'instanceof Source');
    assert.ok(store instanceof Store, 'instanceof Store');
    assert.equal(store.name, 'store', 'should have default name');
  });
});
