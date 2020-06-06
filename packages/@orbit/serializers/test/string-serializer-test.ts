import { StringSerializer } from '../src/string-serializer';

const { module, test } = QUnit;

module('StringSerializer', function (hooks) {
  let serializer: StringSerializer;

  hooks.beforeEach(function () {
    serializer = new StringSerializer();
  });

  test('#serialize returns arg untouched', function (assert) {
    assert.equal(serializer.serialize('abc'), 'abc');
  });

  test('#deserialize returns arg untouched', function (assert) {
    assert.equal(serializer.deserialize('abc'), 'abc');
  });
});
