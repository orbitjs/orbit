import { DateTimeSerializer } from '../src/date-time-serializer';

const { module, test } = QUnit;

module('DateTimeSerializer', function (hooks) {
  let serializer: DateTimeSerializer;

  let dateString = '2015-01-01T10:00:00.000Z';
  let date = new Date(dateString);

  hooks.beforeEach(function () {
    serializer = new DateTimeSerializer();
  });

  test('#serialize returns a date-time in ISO format', function (assert) {
    assert.equal(serializer.serialize(date), dateString);
  });

  test('#deserialize returns a Date, with a time set', function (assert) {
    assert.equal(
      serializer.deserialize(dateString)?.toISOString(),
      date.toISOString()
    );
  });
});
