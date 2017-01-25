import { toIdentifier, parseIdentifier, identity, eqIdentity } from '../../src/lib/identifiers';

const { module, test } = QUnit;

module('Lib / Identifiers', function() {
  test('`toIdentifier` converts inputs to an identifier', function(assert) {
    assert.equal(toIdentifier('planet', '1'), 'planet:1', 'works with `type` and `id` args');
    assert.equal(toIdentifier(null), null, 'works with null');
    assert.equal(toIdentifier({ type: 'planet', id: '1' }), 'planet:1', 'works with an identity object');
  });

  test('`parseIdentifier` converts an identifier string to an object with a `type` and `id`', function(assert) {
    assert.deepEqual(parseIdentifier('planet:1'), { type: 'planet', id: '1' });
  });

  test('`identity` returns a simple { type, id } identity object from any object with a `type` and `id`', function(assert) {
    assert.deepEqual(identity({ type: 'planet', id: '1', attributes: { }, relationships: { } }), { type: 'planet', id: '1' });
  });

  test('`eqIdentity` compares the type/id identity of two objects', function(assert) {
    assert.ok(eqIdentity({ type: 'planet', id: '1' }, { type: 'planet', id: '1' }), 'identities match');
    assert.ok(eqIdentity(null, null), 'identities match');
    assert.ok(!eqIdentity({ type: 'planet', id: '1' }, { type: 'moon', id: '1' }), 'identities do not match');
    assert.ok(!eqIdentity({ type: 'planet', id: '1' }, null), 'identities do not match');
    assert.ok(!eqIdentity(null, { type: 'planet', id: '1' }), 'identities do not match');
  });
});
