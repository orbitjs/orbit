import { DasherizedStringSerializer } from '../src/dasherized-string-serializer';

const { module, test } = QUnit;

module('DasherizedStringSerializer', function (hooks) {
  let serializer: DasherizedStringSerializer;

  hooks.beforeEach(function () {
    serializer = new DasherizedStringSerializer();
  });

  test('#serialize dasherizes strings', function (assert) {
    assert.equal(
      serializer.serialize('lowercase'),
      'lowercase',
      'leaves lowercase words alone'
    );
    assert.equal(
      serializer.serialize('MixedCase'),
      'mixed-case',
      'lowercases and dasherizes MixedCase words'
    );
    assert.equal(
      serializer.serialize('one_two'),
      'one-two',
      'dasherizes underscored words'
    );
    assert.equal(
      serializer.serialize('one two three'),
      'one-two-three',
      'converts space separated words'
    );
  });

  test('#deserialize camelizes strings', function (assert) {
    assert.equal(
      serializer.deserialize('lowercase'),
      'lowercase',
      'leaves lowercase words alone'
    );
    assert.equal(
      serializer.deserialize('MixedCase'),
      'mixedCase',
      'lowercases the first letter in MixedCase words'
    );
    assert.equal(
      serializer.deserialize('one-two'),
      'oneTwo',
      'converts dasherized words'
    );
    assert.equal(
      serializer.deserialize('one_two_three'),
      'oneTwoThree',
      'converts underscored words'
    );
    assert.equal(
      serializer.deserialize('one two three'),
      'oneTwoThree',
      'converts space separated words'
    );
  });
});
