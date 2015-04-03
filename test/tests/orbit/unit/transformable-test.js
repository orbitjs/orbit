import Orbit from 'orbit/main';
import Transformable from 'orbit/transformable';
import { Promise } from 'rsvp';
import { equalOps } from 'tests/test-helper';

var source;

var successfulOperation = function() {
  return new Promise(function(resolve, reject) {
    resolve(':)');
  });
};

var failedOperation = function() {
  return new Promise(function(resolve, reject) {
    reject(':(');
  });
};

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
  expect(2);

  source._transform = function(o) {
    return new Promise(function(resolve, reject) {
      ok(true, '_transform promise resolved');
      resolve();
    });
  };

  Transformable.extend(source);

  stop();
  source.transform({op: 'add', path: 'planet/1', value: 'data'}).then(function() {
    start();
    ok(true, 'transform promise resolved');
  });
});

test("it should resolve when _transform simply returns (without a promise)", function() {
  expect(2);

  source._transform = function() {
    ok(true, '_transform called');
    return;
  };

  Transformable.extend(source);

  stop();
  source.transform({op: 'add', path: 'planet/1', value: 'data'}).then(function() {
    start();
    ok(true, 'transform promise returned');
  });
});

test("it should trigger `didTransform` event BEFORE a transform resolves if the transforms are RELATED", function() {
  expect(6);

  var order = 0,
      addOp = {op: 'add', path: 'planet/1', value: 'data'},
      inverseOp = {op: 'remove', path: 'planet/1'};

  source._transform = function(operation) {
    equal(++order, 1, '_transform performed first');
    equalOps(operation, addOp, '_handler args match original call args');
    this.didTransform(operation, inverseOp);
    return successfulOperation();
  };

  Transformable.extend(source);

  source.on('didTransform', function(operation, inverse) {
    equal(++order, 2, 'didTransform triggered after action performed successfully');
    equalOps(operation, addOp, 'operation matches');
    equalOps(inverse, inverseOp, 'inverse matches');
  });

  stop();
  source.transform(addOp).then(function() {
    start();
    equal(++order, 3, 'promise resolved last');
  });
});

test("it should trigger `didTransform` event AFTER a transform resolves if the transforms are UNRELATED", function() {
  expect(6);

  var order = 0,
      addOp = {op: 'add', path: 'planet/1', value: 'data'},
      unrelatedOp = {op: 'add', path: 'planet/2', value: 'data'},
      inverseOp = {op: 'remove', path: 'planet/2'};

  source._transform = function(operation) {
    equal(++order, 1, '_transform performed first');
    equalOps(operation, addOp, '_handler args match original call args');

    this.didTransform(unrelatedOp, inverseOp);

    return successfulOperation();
  };

  Transformable.extend(source);

  source.on('didTransform', function(operation, inverse) {
    equal(++order, 3, 'didTransform triggered after original unrelated transform resolves');
    equalOps(operation, unrelatedOp, 'operation matches');
    equalOps(inverse, inverseOp, 'inverse matches');
  });

  stop();
  source.transform(addOp).then(function() {
    equal(++order, 2, 'promise resolved after add op');
    source.settleTransforms().then(function() {
      start();
    });
  });
});

test("it should perform transforms in the order they are pushed", function() {
  expect(3);

  var order = 0,
      addOp = {op: 'add', path: '/planet/1', value: 'data'},
      inverseOp = {op: 'remove', path: '/planet/1'};

  source._transform = function(operation) {
    if (operation.op === 'add') {
      equal(++order, 1, '_transform add performed first');
    }

    if (operation.op === 'remove') {
      equal(++order, 2, '_transform remove performed second');
    }

    return successfulOperation();
  };

  Transformable.extend(source);

  stop();
  source.transform([addOp, inverseOp]).then(function() {
    start();
    equal(++order, 3, 'promise resolved last');
  });
});

test("it should wait for the current settle loop before starting another", function() {
  expect(8);

  var order = 0,
      addOp = {op: 'add', path: 'planet/1', value: 'data'},
      inverseOp = {op: 'remove', path: 'planet/1'};

  // though this is definitely an awkward use case, it ensures execution order
  // is what we want it to be
  source._transform = function(operation) {
    // console.log('_transform', operation.serialize());
    if (operation.op === 'add') {
      equal(++order, 1, '_transform `add` performed first');
      this.didTransform(operation, [inverseOp]);

      source.settleTransforms().then(function() {
        start();
        equal(++order, 6, 'settleTransforms finishes after all other transforms');
      });

    }
    if (operation.op === 'remove') {
      equal(++order, 3, '_transform `remove` performed second');
      this.didTransform(operation, [addOp]);
    }
    return successfulOperation();
  };

  Transformable.extend(source);

  source.on('didTransform', function(operation, inverse) {
    if (operation.op === 'add') {
      equal(++order, 2, 'didTransform triggered after `add` transform');
      equalOps(operation, addOp, '`add` operation matches');
    }
    if (operation.op === 'remove') {
      equal(++order, 4, 'didTransform triggered after `remove` transform');
      equalOps(operation, inverseOp, '`remove` operation matches');
    }
  });

  stop();

  source.transform([addOp, inverseOp]).then(function() {
    equal(++order, 5, 'promise resolved last');
  });
});
