import { DateSerializer } from '../src/index';

const { module, test } = QUnit;

module('DateSerializer', function (hooks) {
  let serializer: DateSerializer;

  hooks.beforeEach(function () {
    serializer = new DateSerializer();
  });

  test('#serialize returns a date in YYYY-MM-DD form', function (assert) {
    assert.equal(serializer.serialize(new Date(2017, 11, 31)), '2017-12-31');
  });

  test('#deserialize returns a Date', function (assert) {
    assert.equal(
      serializer.deserialize('2017-12-31').toISOString(),
      new Date(2017, 11, 31).toISOString()
    );
  });
});
