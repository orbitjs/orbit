import { DateSerializer } from '../src/date-serializer';

const { module, test } = QUnit;

module('DateSerializer', function (hooks) {
  let serializer: DateSerializer;

  module('with no options', function (hooks) {
    hooks.beforeEach(function () {
      serializer = new DateSerializer();
    });

    test('#serialize returns a date in YYYY-MM-DD form', function (assert) {
      assert.equal(serializer.serialize(new Date(2017, 11, 31)), '2017-12-31');
    });

    test('#deserialize returns a Date', function (assert) {
      assert.equal(
        serializer.deserialize('2017-12-31')?.toISOString(),
        new Date(2017, 11, 31).toISOString()
      );
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
      serializer = new DateSerializer({
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
      serializer = new DateSerializer({
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
