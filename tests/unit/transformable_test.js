import Orbit from 'orbit/core';
import Transformable from 'orbit/transformable';
import RSVP from 'rsvp';

var source;

var successfulOperation = function() {
  return new RSVP.Promise(function(resolve, reject) {
    resolve(':)');
  });
};

var failedOperation = function() {
  return new RSVP.Promise(function(resolve, reject) {
    reject(':(');
  });
};

///////////////////////////////////////////////////////////////////////////////

module("Unit - Transformable", {
  setup: function() {
    Orbit.Promise = RSVP.Promise;
    source = {};
    Transformable.extend(source);
  },

  teardown: function() {
    source = null;
    Orbit.Promise = null;
  }
});

test("it exists", function() {
  ok(source);
});

test("it should mixin Evented", function() {
  ['on', 'off', 'emit', 'poll'].forEach(function(prop) {
    ok(source[prop], 'should have Evented properties');
  });
});

test("it defines `transform`", function() {
  ok(source.transform, 'transform exists');
});

test("it should require the definition of _transform", function() {
  throws(source._transform, "presence of _transform should be verified");
});


test("it should require that _transform returns a promise", function() {
  expect(2);

  source._transform = successfulOperation;

  stop();
  source.transform().then(function(result) {
    start();
    ok(true, '_transform promise resolved');
    equal(result, ':)', 'success!');
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
