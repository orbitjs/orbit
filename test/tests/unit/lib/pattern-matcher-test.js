import { buildPatternMatcher } from 'orbit/lib/pattern-matcher';

module('Orbit - lib - PatternMatcher', function() {
  test('matches nested properties', function(assert) {
    const isMatch = buildPatternMatcher({ record: { id: 'pluto' } });
    assert.ok(isMatch({ record: { id: 'pluto' } }));
    assert.ok(!isMatch({ record: { id: 'mars' } }));
  });

  test('matches one of provided values', function(assert) {
    const isMatch = buildPatternMatcher({ record: { id: ['pluto', 'jupiter'] } });
    assert.ok(isMatch({ record: { id: 'pluto' } }));
    assert.ok(isMatch({ record: { id: 'jupiter' } }));
    assert.ok(!isMatch({ record: { id: 'venus' } }));
  });

  test('matches several properties', function(assert) {
    const isMatch = buildPatternMatcher({ record: { id: ['pluto', 'jupiter'], type: 'planet' } });
    assert.ok(isMatch({ record: { id: 'pluto', type: 'planet' } }));
    assert.ok(!isMatch({ record: { id: 'pluto', type: 'moon' } }));
  });
});
