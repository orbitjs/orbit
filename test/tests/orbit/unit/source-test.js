import Orbit from 'orbit/main';
import Source from 'orbit/source';
import Transform from 'orbit/transform';

let source;

module('Orbit - Source', {
  setup: function() {
    source = new Source();
  },

  teardown: function() {
    source = null;
  }
});

test('exists', function(assert) {
  assert.ok(source, 'source exists');
  assert.ok(source.transformLog, 'has a transform log');
});

test('it should mixin Evented', function(assert) {
  ['on', 'off', 'emit', 'poll'].forEach(function(prop) {
    assert.ok(source[prop], 'should have Evented properties');
  });
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
