export function arrayMembershipMatches(assert, actual, expected) {
  assert.equal(actual.length, expected.length, 'array lengths match');
  for (let i = 0, l = actual.length; i < l; i++) {
    assert.ok(expected.indexOf(actual[i]) > -1, 'array contains member');
  }
}