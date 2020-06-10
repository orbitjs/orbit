import { UnderscoredStringSerializer } from '../src/underscored-string-serializer';

const { module, test } = QUnit;

module('UnderscoredStringSerializer', function (hooks) {
  let serializer: UnderscoredStringSerializer;

  hooks.beforeEach(function () {
    serializer = new UnderscoredStringSerializer();
  });

  test('#serialize underscores strings', function (assert) {
    assert.equal(
      serializer.serialize('lowercase'),
      'lowercase',
      'leaves lowercase words alone'
    );
    assert.equal(
      serializer.serialize('MixedCase'),
      'mixed_case',
      'lowercases the first letter in MixedCase words'
    );
    assert.equal(
      serializer.serialize('oneTwo'),
      'one_two',
      'converts lowerCamelCase words'
    );
    assert.equal(
      serializer.serialize('one_two_three'),
      'one_two_three',
      'leaves underscore-separated words alone'
    );
    assert.equal(
      serializer.serialize('one two three'),
      'one_two_three',
      'underscores space-separated words'
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
