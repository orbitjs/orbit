import { RecordIdentity } from '@orbit/records';
import { IdentityMap } from '../src/identity-map';
import { RecordIdentitySerializer } from './support/record-identity-serializer';

const { module, test } = QUnit;

module('IdentityMap', function (hooks) {
  class Model {}
  const serializer = new RecordIdentitySerializer();
  let identityMap: IdentityMap<RecordIdentity, Model>;

  hooks.beforeEach(function () {
    identityMap = new IdentityMap({ serializer });
  });

  test('it exists', function (assert) {
    assert.ok(identityMap);
  });

  test('get/set/has/delete', function (assert) {
    const identity = { type: 'person', id: '1' };
    const identity2 = { type: 'person', id: '2' };
    const record = new Model();

    identityMap.set(identity, record);

    assert.ok(identityMap.has(identity));
    assert.ok(!identityMap.has(identity2));
    assert.equal(identityMap.get(identity), record);

    assert.ok(identityMap.delete(identity));
    assert.ok(!identityMap.delete(identity));
    assert.ok(!identityMap.delete(identity2));

    assert.ok(!identityMap.has(identity));
    assert.equal(identityMap.get(identity), undefined);
  });

  test('iterable', function (assert) {
    const identity = { type: 'person', id: '1' };
    const record = new Model();
    const identity2 = { type: 'person', id: '2' };
    const record2 = new Model();

    assert.equal(identityMap.size, 0);

    identityMap.set(identity, record);
    identityMap.set(identity2, record2);

    assert.equal(identityMap.size, 2);
    assert.deepEqual(Array.from(identityMap), [
      [identity, record],
      [identity2, record2]
    ]);
    assert.deepEqual(Array.from(identityMap.entries()), [
      [identity, record],
      [identity2, record2]
    ]);
    assert.deepEqual(Array.from(identityMap.values()), [record, record2]);
    assert.deepEqual(Array.from(identityMap.keys()), [identity, identity2]);
  });

  test('clear', function (assert) {
    const identity = { type: 'person', id: '1' };
    const record = new Model();
    const identity2 = { type: 'person', id: '2' };
    const record2 = new Model();

    identityMap.set(identity, record);
    identityMap.set(identity2, record2);

    identityMap.clear();

    assert.equal(identityMap.size, 0);
    assert.ok(!identityMap.has(identity));
    assert.ok(!identityMap.has(identity2));
  });
});
