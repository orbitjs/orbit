import Orbit from 'orbit/main';
import Transformable from 'orbit/transformable';
import TransformResult from 'orbit/transform-result';
import { Promise } from 'rsvp';
import { equalOps, successfulOperation, failedOperation } from 'tests/test-helper';

var source;

///////////////////////////////////////////////////////////////////////////////

module("Orbit - Transformable", {
  setup: function() {
    Orbit.Promise = Promise;
    source = {};
  },

  teardown: function() {
    source = null;
    Orbit.Promise = null;
  }
});

test("it exists", function() {
  Transformable.extend(source);
  ok(source);
});

test("it should mixin Evented", function() {
  Transformable.extend(source);
  ['on', 'off', 'emit', 'poll'].forEach(function(prop) {
    ok(source[prop], 'should have Evented properties');
  });
});

test("it defines `transform`", function() {
  Transformable.extend(source);
  ok(source.transform, 'transform exists');
});

test("it should require the definition of _transform", function() {
  Transformable.extend(source);
  throws(source._transform, "presence of _transform should be verified");
});


test("it should resolve when _transform returns a promise", function() {
  expect(3);

  source._transform = function(o) {
    return new Promise(function(resolve, reject) {
      ok(true, '_transform promise resolved');
      resolve(':)');
    });
  };

  Transformable.extend(source);

  stop();
  source.transform({op: 'add', path: 'planet/1', value: 'data'})
    .then(function(response) {
      start();
      ok(true, 'transform promise resolved');
      equal(response, ':)', 'response is returned');
    });
});

test("it should resolve when _transform simply returns (without a promise)", function() {
  expect(3);

  source._transform = function() {
    ok(true, '_transform called');
    return ':)';
  };

  Transformable.extend(source);

  stop();
  source.transform({op: 'add', path: 'planet/1', value: 'data'})
    .then(function(response) {
      start();
      ok(true, 'transform promise returned');
      equal(response, ':)', 'response is returned');
    });
});

test("it should trigger `didTransform` event BEFORE a transform resolves", function() {
  expect(5);

  var order = 0,
      addOps = [{op: 'add', path: 'planet/1', value: 'data'}],
      inverseOps = [{op: 'remove', path: 'planet/1'}];

  source._transform = function(ops) {
    equal(++order, 1, '_transform performed first');
    equalOps(ops, addOps, '_handler args match original call args');
  };

  Transformable.extend(source);

  source.on('didTransform', function(transform) {
    equal(++order, 2, 'didTransform triggered after action performed successfully');
    equalOps(transform.operations, addOps, 'applied ops match');
  });

  stop();
  source.transform(addOps).then(function() {
    start();
    equal(++order, 3, 'promise resolved last');
  });
});

test("it should perform transforms in the order they are pushed", function() {
  expect(4);

  var order = 0,
      addOp = {op: 'add', path: 'planet/1', value: 'data'},
      inverseOp = {op: 'remove', path: 'planet/1'};

  source._transform = function(ops) {
    source.settleTransforms().then(function() {
      start();
      equal(++order, 3, 'settleTransforms finishes after all other transforms');
    });

    equalOps(ops, [addOp, inverseOp]);
    equal(++order, 1, '_transform called first');
  };

  Transformable.extend(source);

  stop();
  source.transform([addOp, inverseOp]).then(function() {
    equal(++order, 2, 'promise resolved last');
  });
});

test("it should wait for the current settle loop before starting another", function() {
  expect(8);

  var order = 0,
      addOps = [{op: 'add', path: 'planet/1', value: 'data'}],
      inverseOps = [{op: 'remove', path: 'planet/1'}];

  // though this is definitely an awkward use case, it ensures execution order
  // is what we want it to be
  source._transform = function(operations) {
    // console.log('_transform', operation.serialize());
    if (operations[0].op === 'add') {
      source.settleTransforms().then(function() {
        start();
        equal(++order, 6, 'settleTransforms finishes after all other transforms');
      });

      equal(++order, 1, '_transform `add` performed first');
    }

    if (operations[0].op === 'remove') {
      equal(++order, 3, '_transform `remove` performed second');
    }
  };

  Transformable.extend(source);

  source.on('didTransform', function(transform) {
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
  source.transform(inverseOps).then(function() {
    equal(++order, 5, 'promise resolved last');
  });
});

test("#clearTransformLog can clear the log of any applied transforms", function() {
  expect(2);

  source._transform = function() {
    return new TransformResult();
  };

  Transformable.extend(source);

  stop();
  source.transform({op: 'add', path: 'planet/1', value: 'data'}).then(function() {
    start();
    equal(Object.keys(source._transformLog).length, 1, 'log has an entry');

    source.clearTransformLog();
    equal(Object.keys(source._transformLog).length, 0, 'log has been cleared');
  });

});
