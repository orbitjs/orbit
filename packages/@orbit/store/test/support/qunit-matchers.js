import { buildPatternMatcher } from '@orbit/core';

QUnit.assert.matchesPattern = function(actual, pattern, message) {
  const isMatch = buildPatternMatcher(pattern);
  this.push(isMatch(actual), actual, pattern, message);
};
