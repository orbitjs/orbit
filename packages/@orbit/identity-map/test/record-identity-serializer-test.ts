import { RecordIdentitySerializer } from './support/record-identity-serializer';

const { module, test } = QUnit;

module('RecordIdentitySerializer', function (hooks) {
  class Model {}
  let serializer: RecordIdentitySerializer;

  hooks.beforeEach(function () {
    serializer = new RecordIdentitySerializer();
  });

  test('it exists', function (assert) {
    assert.ok(serializer);
  });

  test('serialize', function (assert) {
    assert.equal(serializer.serialize({ type: 'person', id: '1' }), 'person:1');
  });

  test('deserialize', function (assert) {
    assert.deepEqual(serializer.deserialize('person:1'), {
      type: 'person',
      id: '1'
    });
  });
});
