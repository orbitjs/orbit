import { NumberSerializer } from '../src/number-serializer';

const { module, test } = QUnit;

module('NumberSerializer', function (hooks) {
  let serializer: NumberSerializer;

  hooks.beforeEach(function () {
    serializer = new NumberSerializer();
  });

  test('#serialize returns arg', function (assert) {
    assert.strictEqual(serializer.serialize(1), 1);
    assert.strictEqual(serializer.serialize(2.4), 2.4);
  });

  test('#deserialize returns arg', function (assert) {
    assert.strictEqual(serializer.deserialize(1), 1);
    assert.strictEqual(serializer.deserialize(2.4), 2.4);
  });
});
