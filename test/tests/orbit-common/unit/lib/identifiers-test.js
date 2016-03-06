import { toIdentifier, parseIdentifier, identity } from 'orbit-common/lib/identifiers';

module('OC - Lib - Identifiers', {
});

test('`toIdentifier` converts a `type` and `id` to an identifier string', function(assert) {
  assert.equal(toIdentifier('planet', '1'), 'planet:1');
});

test('`parseIdentifier` converts an identifier string to an object with a `type` and `id`', function(assert) {
  assert.deepEqual(parseIdentifier('planet:1'), { type: 'planet', id: '1' });
});

test('`identity` returns a simple { type, id } identity object from any object with a `type` and `id`', function(assert) {
  assert.deepEqual(identity({ type: 'planet', id: '1', attributes: { }, relationships: { } }), { type: 'planet', id: '1' });
});
