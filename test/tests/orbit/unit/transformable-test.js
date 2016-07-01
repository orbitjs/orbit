import Orbit from 'orbit/main';
import Transformable from 'orbit/transformable';
import Transform from 'orbit/transform';

let source;

///////////////////////////////////////////////////////////////////////////////

module('Orbit - Transformable', {
  setup() {
    source = {};
    Transformable.extend(source);
  },

  teardown() {
    source = null;
  }
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

test('#transform should convert non-Transforms into Transforms', function(assert) {
  assert.expect(2);

  source._transform = function(transform) {
    assert.ok(transform instanceof Transform, 'argument to _transform is a Transform');
    return Orbit.Promise.resolve([transform]);
  };

  return source.transform({ op: 'add', path: 'planet/1', value: 'data' })
    .then(() => {
      assert.ok(true, 'transformed promise resolved');
    });
});
