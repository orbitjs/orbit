import { serializeRecordIdentity, deserializeRecordIdentity, cloneRecordIdentity, equalRecordIdentities } from '../src/record';
import './test-helper';

const { module, test } = QUnit;

module('Record', function() {
  test('`serializeRecordIdentity` converts inputs to an identifier', function(assert) {
    assert.equal(serializeRecordIdentity(null), null, 'works with null');
    assert.equal(serializeRecordIdentity({ type: 'planet', id: '1' }), 'planet:1', 'works with an identity object');
  });

  test('`deserializeRecordIdentity` converts an identifier string to an object with a `type` and `id`', function(assert) {
    assert.deepEqual(deserializeRecordIdentity('planet:1'), { type: 'planet', id: '1' });
  });

  test('`cloneRecordIdentity` returns a simple { type, id } identity object from any object with a `type` and `id`', function(assert) {
    assert.deepEqual(cloneRecordIdentity({ type: 'planet', id: '1', attributes: { }, relationships: { } }), { type: 'planet', id: '1' });
  });

  test('`equalRecordIdentities` compares the type/id identity of two objects', function(assert) {
    assert.ok(equalRecordIdentities({ type: 'planet', id: '1' }, { type: 'planet', id: '1' }), 'identities match');
    assert.ok(equalRecordIdentities(null, null), 'identities match');
    assert.ok(!equalRecordIdentities({ type: 'planet', id: '1' }, { type: 'moon', id: '1' }), 'identities do not match');
    assert.ok(!equalRecordIdentities({ type: 'planet', id: '1' }, null), 'identities do not match');
    assert.ok(!equalRecordIdentities(null, { type: 'planet', id: '1' }), 'identities do not match');
  });
});
