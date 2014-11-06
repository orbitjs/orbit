import Orbit from 'orbit/main';
import Transformable from 'orbit/transformable';
import { Promise } from 'rsvp';

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

  source._transform = function() {
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

test("it should trigger `didTransform` event after a successful transform", function() {
  expect(6);

  var order = 0,
      addOp = {op: 'add', path: 'planet/1', value: 'data'},
      inverseOp = {op: 'remove', path: 'planet/1'};

  source._transform = function(operation) {
    equal(++order, 1, '_transform performed first');
    deepEqual(Array.prototype.slice.call(arguments, 0), [addOp], '_handler args match original call args');
    this.didTransform(addOp, inverseOp);
    return successfulOperation();
  };

  Transformable.extend(source);

  source.on('didTransform', function(operation, inverse) {
    equal(++order, 2, 'didTransform triggered after action performed successfully');
    deepEqual(operation, addOp, 'operation matches');
    deepEqual(inverse, inverseOp, 'inverse matches');
  });

  stop();
  source.transform(addOp).then(function() {
    start();
    equal(++order, 3, 'promise resolved last');
  });
});


test("it should wait for the current settle loop before starting another", function() {
  expect(11);

  var order = 0,
      addOp = {op: 'add', path: 'planet/1', value: 'data'},
      inverseOp = {op: 'remove', path: 'planet/1'};

  // though this is definitely an awkward use case, it definitely ensures execution order
  // is what we want it to be
  source._transform = function(operation) {
    if (operation.op === 'add') {
      equal(++order, 1, '_transform add performed first');
      this.didTransform(addOp, inverseOp);
      this.settleTransforms().then(function() {
        equal(++order, 7, 'settleTransforms while transforming called after other transforms');
      });
    }
    if (operation.op === 'remove') {
      equal(++order, 3, '_transform remove performed second');
      this.didTransform(inverseOp, {order: 4});
      this.didTransform(inverseOp, {order: 5});
      this.didTransform(inverseOp, {order: 6});
      this.settleTransforms().then(function() {
        equal(++order, 8, 'settleTransforms while transforming called after other transforms');
      });
      this.settleTransforms().then(function() {
        equal(++order, 9, 'settleTransforms while transforming called after other transforms');
      });
    }
    return successfulOperation();
  };

  Transformable.extend(source);

  source.on('didTransform', function(operation, inverse) {
    if (operation.op === 'add') {
      equal(++order, 2, 'didTransform triggered after action performed successfully');
      deepEqual(operation, addOp, 'operation matches');
    }
    if (operation.op === 'remove') {
      equal(++order, inverse.order, 'didTransform triggered after action');
    }
  });

  stop();
  source.transform([addOp, inverseOp]).then(function() {
    start();
    equal(++order, 10, 'promise resolved last');
  });
});
