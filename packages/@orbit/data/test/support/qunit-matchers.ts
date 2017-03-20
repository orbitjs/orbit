import { buildPatternMatcher } from './pattern-matcher';

QUnit.assert.matchesPattern = function(actual, pattern, message) {
  const isMatch = buildPatternMatcher(pattern);
  this.push(isMatch(actual), actual, pattern, message);
};
