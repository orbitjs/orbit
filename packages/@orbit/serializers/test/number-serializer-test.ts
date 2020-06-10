import { NumberSerializer } from '../src/number-serializer';

const { module, test } = QUnit;

module('NumberSerializer', function (hooks) {
  let serializer: NumberSerializer;

  module('with no options', function (hooks) {
    hooks.beforeEach(function () {
      serializer = new NumberSerializer();
    });

    test('#serialize returns arg untouched', function (assert) {
      assert.strictEqual(serializer.serialize(1), 1);
      assert.strictEqual(serializer.serialize(2.4), 2.4);
    });

    test('#deserialize returns arg untouched', function (assert) {
      assert.strictEqual(serializer.deserialize(1), 1);
      assert.strictEqual(serializer.deserialize(2.4), 2.4);
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
      serializer = new NumberSerializer({
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
      serializer = new NumberSerializer({
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
