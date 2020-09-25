export function arrayMembershipMatches(
  assert: unknown,
  actual: unknown[],
  expected: unknown[]
): void {
  (assert as any).equal(actual.length, expected.length, 'array lengths match');
  for (let i = 0, l = actual.length; i < l; i++) {
    (assert as any).ok(
      expected.indexOf(actual[i]) > -1,
      'array contains member'
    );
  }
}
