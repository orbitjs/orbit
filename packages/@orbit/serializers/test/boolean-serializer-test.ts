import { BooleanSerializer } from '../src/boolean-serializer';

const { module, test } = QUnit;

module('BooleanSerializer', function (hooks) {
  let serializer: BooleanSerializer;

  module('with no options', function (hooks) {
    hooks.beforeEach(function () {
      serializer = new BooleanSerializer();
    });

    test('#serialize returns arg untouched', function (assert) {
      assert.strictEqual(serializer.serialize(true), true);
      assert.strictEqual(serializer.serialize(false), false);
    });

    test('#deserialize returns arg untouched', function (assert) {
      assert.strictEqual(serializer.deserialize(true), true);
      assert.strictEqual(serializer.deserialize(false), false);
    });

    test('#serialize returns nulls', function (assert) {
      assert.equal(serializer.serialize(null), null);
    });

    test('#deserialize returns nulls', function (assert) {
      assert.equal(serializer.deserialize(null), null);
    });
  });

  module('serializationOptions: { disallowNull: false }', function (hooks) {
    hooks.beforeEach(function () {
      serializer = new BooleanSerializer({
        serializationOptions: { disallowNull: false }
      });
    });

    test('#serialize returns nulls', function (assert) {
      assert.equal(serializer.serialize(null), null);
    });

    test('#deserialize returns nulls', function (assert) {
      assert.equal(serializer.deserialize(null), null);
    });
  });

  module('serializationOptions: { disallowNull: true }', function (hooks) {
    hooks.beforeEach(function () {
      serializer = new BooleanSerializer({
        serializationOptions: { disallowNull: true }
      });
    });

    test('#serialize throws error on null', function (assert) {
      assert.throws(() => {
        serializer.serialize(null);
      }, 'null is not allowed');
    });

    test('#deserialize throws error on null', function (assert) {
      assert.throws(() => {
        serializer.deserialize(null);
      }, 'null is not allowed');
    });
  });
});
