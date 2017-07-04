import { cloneRecordIdentity, equalRecordIdentities } from '../src/record';
import './test-helper';

const { module, test } = QUnit;

module('Record', function() {
  test('`cloneRecordIdentity` returns a simple { type, id } identity object from any object with a `type` and `id`', function(assert) {
    assert.deepEqual(cloneRecordIdentity({ type: 'planet', id: '1' }), { type: 'planet', id: '1' });
  });

  test('`equalRecordIdentities` compares the type/id identity of two objects', function(assert) {
    assert.ok(equalRecordIdentities({ type: 'planet', id: '1' }, { type: 'planet', id: '1' }), 'identities match');
    assert.ok(equalRecordIdentities(null, null), 'identities match');
    assert.ok(!equalRecordIdentities({ type: 'planet', id: '1' }, { type: 'moon', id: '1' }), 'identities do not match');
    assert.ok(!equalRecordIdentities({ type: 'planet', id: '1' }, null), 'identities do not match');
    assert.ok(!equalRecordIdentities(null, { type: 'planet', id: '1' }), 'identities do not match');
  });
});
