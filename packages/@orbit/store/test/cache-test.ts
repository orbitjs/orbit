import { Schema } from '@orbit/data';
import { Cache } from '../src/index';

const { module, test } = QUnit;

module('Cache', function (hooks) {
  let schema: Schema;
  let cache: Cache;

  hooks.beforeEach(function () {
    schema = new Schema({
      models: {
        planet: {}
      }
    });
    cache = new Cache({ schema });
  });

  hooks.afterEach(function () {
    schema = null;
    cache = null;
  });

  test('it exists', function (assert) {
    assert.ok(cache instanceof Cache, 'instanceof Cache');
  });
});
