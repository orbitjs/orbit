import { DateSerializer } from '../src/date-serializer';

const { module, test } = QUnit;

module('DateSerializer', function (hooks) {
  let serializer: DateSerializer;

  hooks.beforeEach(function () {
    serializer = new DateSerializer();
  });

  test('#serialize returns a date in YYYY-MM-DD form', function (assert) {
    assert.equal(serializer.serialize(new Date(2017, 11, 31)), '2017-12-31');
  });

  test('#serialize returns a date in YYYY-MM-DD form when leading zeros are needed', function (assert) {
    assert.equal(serializer.serialize(new Date(2017, 4, 31)), '2017-05-31');
  });

  test('#deserialize returns a Date', function (assert) {
    assert.equal(
      serializer.deserialize('2017-12-31')?.toISOString(),
      new Date(2017, 11, 31).toISOString()
    );
  });
});
