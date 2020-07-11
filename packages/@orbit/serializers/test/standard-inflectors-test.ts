import {
  capitalize,
  camelize,
  decamelize,
  dasherize,
  underscore
} from '../src/standard-inflectors';

const { module, test } = QUnit;

module('standard-inflectors', function () {
  test('#capitalize capitalizes the first letter of a word', function (assert) {
    assert.equal(
      capitalize('cauliflower'),
      'Cauliflower',
      'capitalize capitalizes the first letter of a word'
    );
    assert.equal(
      capitalize('aSAP'),
      'ASAP',
      "capitalize doesn't touch the rest of the word"
    );
  });

  test('#camelize converts a word to lower camelCase', function (assert) {
    assert.equal(
      camelize('lowercase'),
      'lowercase',
      'leaves lowercase words alone'
    );
    assert.equal(
      camelize('MixedCase'),
      'mixedCase',
      'lowercases the first letter in MixedCase words'
    );
    assert.equal(camelize('one-two'), 'oneTwo', 'converts dasherized words');
    assert.equal(
      camelize('one_two_three'),
      'oneTwoThree',
      'converts underscored words'
    );
    assert.equal(
      camelize('one two three'),
      'oneTwoThree',
      'converts space separated words'
    );
  });

  test('#decamelize converts a camelized string into all lowercase separated by underscores', function (assert) {
    assert.equal(
      decamelize('lowercase'),
      'lowercase',
      'leaves lowercase words alone'
    );
    assert.equal(
      decamelize('MixedCase'),
      'mixed_case',
      'lowercases the first letter in MixedCase words'
    );
    assert.equal(
      decamelize('oneTwo'),
      'one_two',
      'converts lowerCamelCase words'
    );
    assert.equal(
      decamelize('one_two_three'),
      'one_two_three',
      'leaves underscore-separated words alone'
    );
    assert.equal(
      decamelize('one two three'),
      'one two three',
      'leaves space-separated words alone'
    );
  });

  test('#dasherize converts underscored or camelized words to be dasherized', function (assert) {
    assert.equal(
      dasherize('lowercase'),
      'lowercase',
      'leaves lowercase words alone'
    );
    assert.equal(
      dasherize('MixedCase'),
      'mixed-case',
      'lowercases and dasherizes MixedCase words'
    );
    assert.equal(
      dasherize('one_two'),
      'one-two',
      'dasherizes underscored words'
    );
    assert.equal(
      dasherize('one two three'),
      'one-two-three',
      'converts space separated words'
    );
  });

  test('#underscore converts a camelized string into all lowercase separated by underscores', function (assert) {
    assert.equal(
      underscore('lowercase'),
      'lowercase',
      'leaves lowercase words alone'
    );
    assert.equal(
      underscore('MixedCase'),
      'mixed_case',
      'lowercases the first letter in MixedCase words'
    );
    assert.equal(
      underscore('oneTwo'),
      'one_two',
      'converts lowerCamelCase words'
    );
    assert.equal(
      underscore('one_two_three'),
      'one_two_three',
      'leaves underscore-separated words alone'
    );
    assert.equal(
      underscore('one two three'),
      'one_two_three',
      'underscores space-separated words'
    );
  });
});
