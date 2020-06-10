import { NoopSerializer } from '../src/noop-serializer';

const { module, test } = QUnit;

module('NoopSerializer', function (hooks) {
  let serializer: NoopSerializer;

  hooks.beforeEach(function () {
    serializer = new NoopSerializer();
  });

  test('#serialize returns arg untouched', function (assert) {
    assert.equal(serializer.serialize('abc'), 'abc');
    assert.equal(serializer.serialize(123), 123);
    assert.equal(serializer.serialize(true), true);
  });

  test('#deserialize returns arg untouched', function (assert) {
    assert.equal(serializer.deserialize('abc'), 'abc');
    assert.equal(serializer.deserialize(123), 123);
    assert.equal(serializer.deserialize(true), true);
  });
});
