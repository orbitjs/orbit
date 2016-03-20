import { Observable } from 'rxjs/Observable';
import { buildPatternMatcher } from 'orbit/lib/pattern-matcher';

Observable.prototype.matching = function(pattern) {
  const isMatch = buildPatternMatcher(pattern);
  return this.filter(value => isMatch(value));
}
