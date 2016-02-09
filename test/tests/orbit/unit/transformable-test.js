import { equalOps, successfulOperation, failedOperation } from 'tests/test-helper';
import Orbit from 'orbit/main';
import Transformable from 'orbit/transformable';
import { Class } from 'orbit/lib/objects';
import { Promise } from 'rsvp';

let Source, source;

///////////////////////////////////////////////////////////////////////////////

module('Orbit - Transformable', {
  setup: function() {
    Source = Class.extend(Transformable);
    source = new Source();
  },

  teardown: function() {
    Source = source = null;
  }
});

test('it exists', function() {
  ok(source);
});

test('it should mixin Evented', function() {
  ['on', 'off', 'emit', 'poll'].forEach(function(prop) {
    ok(source[prop], 'should have Evented properties');
  });
});

test('it defines `transform`', function() {
  ok(source.transform, 'transform exists');
});

test('it should require the definition of _transform', function() {
  throws(source._transform, 'presence of _transform should be verified');
});


test('it should resolve when _transform returns a promise', function() {
  expect(2);

  source._transform = function(o) {
    return new Promise(function(resolve, reject) {
      ok(true, '_transform promise resolved');
      resolve(':)');
    });
  };

  stop();
  source.transform({ op: 'add', path: 'planet/1', value: 'data' })
    .then(() => {
      start();
      ok(true, 'transform promise resolved');
    });
});

test('it should resolve when _transform simply returns (without a promise)', function() {
  expect(2);

  source._transform = function() {
    ok(true, '_transform called');
    return ':)';
  };

  stop();
  source.transform({ op: 'add', path: 'planet/1', value: 'data' })
    .then(() => {
      start();
      ok(true, 'transform promise returned');
    });
});

test('it should trigger `transform` event BEFORE a transform resolves', function() {
  expect(5);

  let order = 0;
  let addOps = [{ op: 'add', path: 'planet/1', value: 'data' }];
  let inverseOps = [{ op: 'remove', path: 'planet/1' }];

  source._transform = function(transform) {
    equal(++order, 1, '_transform performed first');
    equalOps(transform.operations, addOps, '_handler args match original call args');
    this.transformed(transform);
  };

  source.on('transform', function(transform) {
    equal(++order, 2, 'transform triggered after action performed successfully');
    equalOps(transform.operations, addOps, 'applied ops match');
  });

  stop();
  source.transform(addOps)
    .then(() => {
      start();
      equal(++order, 3, 'promise resolved last');
    });
});

test('it should perform transforms in the order they are pushed', function() {
  expect(4);

  let order = 0;
  let addOp = { op: 'add', path: 'planet/1', value: 'data' };
  let inverseOp = { op: 'remove', path: 'planet/1' };

  source._transform = function(transform) {
    source.settleTransforms().then(function() {
      start();
      equal(++order, 3, 'settleTransforms finishes after all other transforms');
    });

    equalOps(transform.operations, [addOp, inverseOp]);
    equal(++order, 1, '_transform called first');
  };

  stop();
  source.transform([addOp, inverseOp])
    .then(() => {
      equal(++order, 2, 'promise resolved last');
    });
});

test('it should wait for the current settle loop before starting another', function() {
  expect(8);

  let order = 0;
  let addOps = [{ op: 'add', path: 'planet/1', value: 'data' }];
  let inverseOps = [{ op: 'remove', path: 'planet/1' }];

  // though this is definitely an awkward use case, it ensures execution order
  // is what we want it to be
  source._transform = function(transform) {
    // console.log('_transform', operation.serialize());
    if (transform.operations[0].op === 'add') {
      source.settleTransforms().then(function() {
        start();
        equal(++order, 6, 'settleTransforms finishes after all other transforms');
      });

      equal(++order, 1, '_transform `add` performed first');
    }

    if (transform.operations[0].op === 'remove') {
      equal(++order, 3, '_transform `remove` performed second');
    }

    this.transformed(transform);
  };

  source.on('transform', function(transform) {
    if (transform.operations[0].op === 'add') {
      equal(++order, 2, 'didTransform triggered after `add` transform');
      equalOps(transform.operations, addOps, '`add` operation matches');
    }
    if (transform.operations[0].op === 'remove') {
      equal(++order, 4, 'didTransform triggered after `remove` transform');
      equalOps(transform.operations, inverseOps, '`remove` operation matches');
    }
  });

  stop();

  source.transform(addOps);
  source.transform(inverseOps)
    .then(() => {
      equal(++order, 5, 'promise resolved last');
    });
});

test('#clearTransformLog can clear the log of any applied transforms', function() {
  expect(2);

  source._transform = function(transform) {
    return this.transformed(transform);
  };

  stop();
  source.transform({ op: 'add', path: 'planet/1', value: 'data' })
    .then(() => {
      start();
      equal(Object.keys(source._transformLog).length, 1, 'log has an entry');

      source.clearTransformLog();
      equal(Object.keys(source._transformLog).length, 0, 'log has been cleared');
    });
});
