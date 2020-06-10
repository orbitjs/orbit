import { DateTimeSerializer } from '../src/date-time-serializer';

const { module, test } = QUnit;

module('DateTimeSerializer', function (hooks) {
  let serializer: DateTimeSerializer;

  let dateString = '2015-01-01T10:00:00.000Z';
  let date = new Date(dateString);

  module('with no options', function (hooks) {
    hooks.beforeEach(function () {
      serializer = new DateTimeSerializer();
    });

    test('#serialize returns a date-time in ISO format', function (assert) {
      assert.equal(serializer.serialize(date), dateString);
    });

    test('#deserialize returns a Date, with a time set', function (assert) {
      assert.equal(
        serializer.deserialize(dateString).toISOString(),
        date.toISOString()
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
      serializer = new DateTimeSerializer({
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
      serializer = new DateTimeSerializer({
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
