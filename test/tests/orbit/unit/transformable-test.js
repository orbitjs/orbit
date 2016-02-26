import { equalOps, successfulOperation, failedOperation } from 'tests/test-helper';
import Orbit from 'orbit/main';
import Transformable from 'orbit/transformable';
import Transform from 'orbit/transform';
import { TransformBuilderNotRegisteredException } from 'orbit/lib/exceptions';
import { Class } from 'orbit/lib/objects';
import { Promise } from 'rsvp';

let Source, source;

///////////////////////////////////////////////////////////////////////////////

module('Orbit - Transformable', {
  setup() {
    Source = Class.extend(Transformable);
    source = new Source();
  },

  teardown() {
    Source = source = null;
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

test('it defines `transform`', function(assert) {
  assert.ok(source.transform, 'transform exists');
});

test('it should require the definition of _transform', function(assert) {
  assert.throws(source._transform, 'presence of _transform should be verified');
});

test('#transform should resolve when _transform returns a promise', function(assert) {
  assert.expect(2);

  source._transform = function(o) {
    return new Promise(function(resolve, reject) {
      assert.ok(true, '_transform promise resolved');
      resolve(':)');
    });
  };

  return source.transform({ op: 'add', path: 'planet/1', value: 'data' })
    .then(() => {
      assert.ok(true, 'transform promise resolved');
    });
});

test('#transform should resolve when _transform simply returns (without a promise)', function(assert) {
  assert.expect(2);

  source._transform = function() {
    assert.ok(true, '_transform called');
    return ':)';
  };

  return source.transform({ op: 'add', path: 'planet/1', value: 'data' })
    .then(() => {
      assert.ok(true, 'transform promise returned');
    });
});

test('#transform should trigger `transform` event BEFORE a transform resolves', function(assert) {
  assert.expect(5);

  let order = 0;
  let addOps = [{ op: 'add', path: 'planet/1', value: 'data' }];
  let inverseOps = [{ op: 'remove', path: 'planet/1' }];

  source._transform = function(transform) {
    assert.equal(++order, 1, '_transform performed first');
    equalOps(transform.operations, addOps, '_handler args match original call args');
    this.transformed(transform);
  };

  source.on('transform', function(transform) {
    assert.equal(++order, 2, 'transform triggered after action performed successfully');
    equalOps(transform.operations, addOps, 'applied ops match');
  });

  return source.transform(addOps)
    .then(() => {
      assert.equal(++order, 3, 'promise resolved last');
    });
});

test('#transform should perform transforms in the order they are pushed', function(assert) {
  assert.expect(4);

  let order = 0;
  let addOp = { op: 'add', path: 'planet/1', value: 'data' };
  let inverseOp = { op: 'remove', path: 'planet/1' };

  source._transform = function(transform) {
    source.settleTransforms().then(function() {
      assert.equal(++order, 3, 'settleTransforms finishes after all other transforms');
    });

    equalOps(transform.operations, [addOp, inverseOp]);
    assert.equal(++order, 1, '_transform called first');
  };

  return source.transform([addOp, inverseOp])
    .then(() => {
      assert.equal(++order, 2, 'promise resolved last');
    });
});

test('#transform should wait for the current settle loop before starting another', function(assert) {
  assert.expect(8);

  let order = 0;
  let addOps = [{ op: 'add', path: 'planet/1', value: 'data' }];
  let inverseOps = [{ op: 'remove', path: 'planet/1' }];

  // though this is definitely an awkward use case, it ensures execution order
  // is what we want it to be
  source._transform = function(transform) {
    // console.log('_transform', operation.serialize());
    if (transform.operations[0].op === 'add') {
      source.settleTransforms().then(function() {
        assert.equal(++order, 6, 'settleTransforms finishes after all other transforms');
      });

      assert.equal(++order, 1, '_transform `add` performed first');
    }

    if (transform.operations[0].op === 'remove') {
      assert.equal(++order, 3, '_transform `remove` performed second');
    }

    this.transformed(transform);
  };

  source.on('transform', function(transform) {
    if (transform.operations[0].op === 'add') {
      assert.equal(++order, 2, 'didTransform triggered after `add` transform');
      equalOps(transform.operations, addOps, '`add` operation matches');
    }
    if (transform.operations[0].op === 'remove') {
      assert.equal(++order, 4, 'didTransform triggered after `remove` transform');
      equalOps(transform.operations, inverseOps, '`remove` operation matches');
    }
  });

  source.transform(addOps);
  return source.transform(inverseOps)
    .then(() => {
      equal(++order, 5, 'promise resolved last');
    });
});

test('#transform should convert non-Transforms into Transforms', function(assert) {
  assert.expect(2);

  source._transform = function(t) {
    assert.ok(t instanceof Transform, '_transform arg is a Transform');
    return ':)';
  };

  return source.transform({ op: 'add', path: 'planet/1', value: 'data' })
    .then(() => {
      assert.ok(true, 'transform promise returned');
    });
});

test('#transform should pass any transform functions to source._transformBuilder, if one is registered', function(assert) {
  assert.expect(5);

  let planet = { type: 'planet', id: '1' };

  source._transformBuilder = function(b) {
    let operations = [];

    let context = {
      addRecord(record) {
        assert.strictEqual(record, planet, 'builder.addRecord called');
        operations.push({ op: 'addRecord', record: record });
      }
    };

    assert.ok(b, '_transformBuilder called');

    b(context);

    return new Transform(operations);
  };

  source._transform = function(t) {
    assert.ok(t instanceof Transform, '_transform arg is a Transform');
    assert.equal(t.operations.length, 1, 'one operation has been passed');
    return ':)';
  };

  return source.transform(
    (b) => {
      b.addRecord(planet);
    })
    .then(() => {
      assert.ok(true, 'transform promise returned');
    });
});

test('#transform should throw an exception if source._transformBuilder is not registered', function(assert) {
  assert.throws(
    function() {
      source.transform((b) => {});
    },
    TransformBuilderNotRegisteredException
  );
});

test('#clearTransformLog can clear the log of any applied transforms', function(assert) {
  assert.expect(2);

  source._transform = function(transform) {
    return this.transformed(transform);
  };

  return source.transform({ op: 'add', path: 'planet/1', value: 'data' })
    .then(() => {
      assert.equal(Object.keys(source._transformLog).length, 1, 'log has an entry');

      source.clearTransformLog();
      assert.equal(Object.keys(source._transformLog).length, 0, 'log has been cleared');
    });
});
