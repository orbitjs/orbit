import Source from 'orbit/source';
import Transform from 'orbit/transform';

module('Orbit - Source', function(hooks) {
  const transformA = Transform.from({ op: 'addRecord', value: {} });
  const transformB = Transform.from({ op: 'addRecord', value: {} });
  const transformC = Transform.from({ op: 'addRecord', value: {} });

  let source;

  hooks.beforeEach(function() {
    source = new Source();
  });

  test('it exists', function(assert) {
    assert.ok(source);
    assert.ok(source.transformLog, 'has a transform log');
  });

  test('it should mixin Evented', function(assert) {
    ['on', 'off', 'emit', 'poll'].forEach(function(prop) {
      assert.ok(source[prop], 'should have Evented properties');
    });
  });

  test('it defines `transformed`', function(assert) {
    assert.equal(typeof source.transformed, 'function', 'transformed exists');
  });

  test('#transformed should trigger `transform` event BEFORE resolving', function(assert) {
    assert.expect(3);

    let order = 0;
    const appliedTransform = Transform.from({ op: 'addRecord', value: {} });

    source.on('transform', (transform) => {
      assert.equal(++order, 1, '`transform` event triggered after action performed successfully');
      assert.strictEqual(transform, appliedTransform, 'applied transform matches');
    });

    return source.transformed([appliedTransform])
      .then(() => {
        assert.equal(++order, 2, 'transformed promise resolved last');
      });
  });

  test('#transformLog contains transforms applied', function(assert) {
    assert.expect(2);

    const appliedTransform = Transform.from({ op: 'addRecord', value: {} });

    assert.ok(!source.transformLog.contains(appliedTransform.id));

    return source
      .transformed([appliedTransform])
      .then(() => assert.ok(source.transformLog.contains(appliedTransform.id)));
  });

  test('it can truncate its transform history', function(assert) {
    return source.transformed([transformA, transformB, transformC])
      .then(() => {
        assert.deepEqual(
          source.transformLog.entries(),
          [transformA, transformB, transformC].map(t => t.id),
          'transform log is correct');

        source.truncateHistory(transformB.id);

        assert.deepEqual(
          source.transformLog.entries(),
          [transformB, transformC].map(t => t.id),
          'transform log has been truncated');
      });
  });

  test('it can clear its transform history', function(assert) {
    return source.transformed([transformA, transformB, transformC])
      .then(() => {
        assert.deepEqual(
          source.transformLog.entries(),
          [transformA, transformB, transformC].map(t => t.id),
          'transform log is correct');

        source.clearHistory();

        assert.deepEqual(
          source.transformLog.entries(),
          [],
          'transform log has been cleared');
      });
  });
});
