import { capitalize, camelize, decamelize, dasherize, underscore } from 'orbit/lib/strings';

module('Orbit - Lib - Strings', {
});

test('#capitalize capitalizes the first letter of a word', function() {
  equal(capitalize('cauliflower'), 'Cauliflower', 'capitalize capitalizes the first letter of a word');
  equal(capitalize('aSAP'), 'ASAP', 'capitalize doesn\'t touch the rest of the word');
});

test('#camelize converts a word to lower camelCase', function() {
  equal(camelize('lowercase'), 'lowercase', 'leaves lowercase words alone');
  equal(camelize('MixedCase'), 'mixedCase', 'lowercases the first letter in MixedCase words');
  equal(camelize('one-two'), 'oneTwo', 'converts dasherized words');
  equal(camelize('one_two_three'), 'oneTwoThree', 'converts underscored words');
  equal(camelize('one two three'), 'oneTwoThree', 'converts space separated words');
});

test('#decamelize converts a camelized string into all lowercase separated by underscores', function() {
  equal(decamelize('lowercase'), 'lowercase', 'leaves lowercase words alone');
  equal(decamelize('MixedCase'), 'mixed_case', 'lowercases the first letter in MixedCase words');
  equal(decamelize('oneTwo'), 'one_two', 'converts lowerCamelCase words');
  equal(decamelize('one_two_three'), 'one_two_three', 'leaves underscore-separated words alone');
  equal(decamelize('one two three'), 'one two three', 'leaves space-separated words alone');
});

test('#dasherize converts underscored or camelized words to be dasherized', function() {
  equal(dasherize('lowercase'), 'lowercase', 'leaves lowercase words alone');
  equal(dasherize('MixedCase'), 'mixed-case', 'lowercases and dasherizes MixedCase words');
  equal(dasherize('one_two'), 'one-two', 'dasherizes underscored words');
  equal(dasherize('one two three'), 'one-two-three', 'converts space separated words');
});

test('#underscore converts a camelized string into all lowercase separated by underscores', function() {
  equal(underscore('lowercase'), 'lowercase', 'leaves lowercase words alone');
  equal(underscore('MixedCase'), 'mixed_case', 'lowercases the first letter in MixedCase words');
  equal(underscore('oneTwo'), 'one_two', 'converts lowerCamelCase words');
  equal(underscore('one_two_three'), 'one_two_three', 'leaves underscore-separated words alone');
  equal(underscore('one two three'), 'one_two_three', 'underscores space-separated words');
});
