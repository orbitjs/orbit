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

  var order = 0;

  source._transform = function() {
    equal(++order, 1, '_transform performed first');
    deepEqual(Array.prototype.slice.call(arguments, 0), ['insert', 'planet', 'data'], '_handler args match original call args');
    return successfulOperation();
  };

  source.on('didTransform', function() {
    equal(++order, 2, 'didTransform triggered after action performed successfully');
    deepEqual(Array.prototype.slice.call(arguments, 0), ['insert', 'planet', ':)'], 'event handler args include `type` + return value');
  });

  stop();
  source.transform('insert', 'planet', 'data').then(function(result) {
    start();
    equal(++order, 3, 'promise resolved last');
    equal(result, ':)', 'success!');
  });
});

test("it should trigger `didNotTransform` event after an unsuccessful action", function() {
  expect(6);

  var order = 0;

  source._transform = function() {
    equal(++order, 1, '_transform performed first');
    deepEqual(Array.prototype.slice.call(arguments, 0), ['insert', 'planet', 'data'], '_handler args match original call args');
    return failedOperation();
  };

  source.on('didTransform', function() {
    ok(false, 'didTransform should not be triggered');
  });

  source.on('didNotTransform', function() {
    equal(++order, 2, 'didNotTransform triggered after an unsuccessful action');
    deepEqual(Array.prototype.slice.call(arguments, 0), ['insert', 'planet', 'data', ':('], 'event handler args match original call args + return value');
  });

  stop();
  source.transform('insert', 'planet', 'data').then(null, function(result) {
    start();
    equal(++order, 3, 'promise resolved last');
    equal(result, ':(', 'failure');
  });
});
