import { BooleanSerializer } from '../src/boolean-serializer';

const { module, test } = QUnit;

module('BooleanSerializer', function (hooks) {
  let serializer: BooleanSerializer;

  hooks.beforeEach(function () {
    serializer = new BooleanSerializer();
  });

  test('#serialize returns arg', function (assert) {
    assert.strictEqual(serializer.serialize(true), true);
    assert.strictEqual(serializer.serialize(false), false);
  });

  test('#deserialize returns arg', function (assert) {
    assert.strictEqual(serializer.deserialize(true), true);
    assert.strictEqual(serializer.deserialize(false), false);
  });
});
