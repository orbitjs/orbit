import { successfulOperation, failedOperation } from 'tests/test-helper';
import Orbit from 'orbit/main';
import Transformable from 'orbit/transformable';
import Transform from 'orbit/transform';
import TransformBuilder from 'orbit-common/transform/builder';
import { TransformBuilderNotRegisteredException } from 'orbit/lib/exceptions';
import { Class } from 'orbit/lib/objects';
import { Promise } from 'rsvp';

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
});

test('it should mixin Evented', function(assert) {
  ['on', 'off', 'emit', 'poll'].forEach(function(prop) {
    assert.ok(source[prop], 'should have Evented properties');
  });
});

test('it defines `transformed`', function(assert) {
  assert.equal(typeof source.transformed, 'function', 'transformed exists');
});

test('it should require the definition of _transform', function(assert) {
  assert.throws(source._transform, 'presence of _transform should be verified');
});

test('#transformed should trigger `transform` event BEFORE resolving', function(assert) {
  assert.expect(3);

  let order = 0;
  let addOps = [{ op: 'add', path: 'planet/1', value: 'data' }];

  source.on('transform', function(transform) {
    assert.equal(++order, 1, 'transform triggered after action performed successfully');
    assert.deepEqual(transform.operations, addOps, 'applied ops match');
  });

  return source.transformed(addOps)
    .then(() => {
      assert.equal(++order, 2, 'transformed promise resolved last');
    });
});

test('#transformed should convert non-Transforms into Transforms', function(assert) {
  assert.expect(2);

  source.on('transform', function(transform) {
    assert.ok(transform instanceof Transform, 'emitted transform is a Transform');
  });

  return source.transformed({ op: 'add', path: 'planet/1', value: 'data' })
    .then(() => {
      assert.ok(true, 'transformed promise resolved');
    });
});

test('#transformed should pass any transform functions to source.transformBuilder, if one is registered', function(assert) {
  assert.expect(4);

  let planet = { type: 'planet', id: '1' };

  source.transformBuilder = {
    build(b) {
      let operations = [];

      let context = {
        addRecord(record) {
          assert.strictEqual(record, planet, 'builder.addRecord called');
          operations.push({ op: 'addRecord', record: record });
        }
      };

      assert.ok(b, 'transformBuilder called');

      b(context);

      return new Transform(operations);
    }
  };

  source.on('transform', function(transform) {
    assert.ok(transform instanceof Transform, 'emitted transform is a Transform');
  });

  return source.transformed(
    (b) => {
      b.addRecord(planet);
    })
    .then(() => {
      assert.ok(true, 'transform promise returned');
    });
});

test('#transform should throw an exception if source.transformBuilder is not registered', function(assert) {
  assert.throws(
    function() {
      source.transformed((b) => {});
    },
    TransformBuilderNotRegisteredException
  );
});

test('#transformLog contains transforms applied to a Transformable', function(assert) {
  assert.expect(2);

  const transform = new TransformBuilder().build(t => t.addRecord({ type: 'planet', id: 'pluto' }));

  assert.ok(!source.transformLog.contains(transform.id));

  return source
    .transformed(transform)
    .then(() => assert.ok(source.transformLog.contains(transform.id)));
});
