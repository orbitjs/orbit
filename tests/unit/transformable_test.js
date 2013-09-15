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
    source = {};
    Transformable.extend(source);
  },

  teardown: function() {
    source = null;
  }
});

test("it exists", function() {
  ok(source);
});

test("it should mixin Evented", function() {
  ['on', 'off', 'emit', 'poll'].forEach(function(prop) {
    ok(source[prop], 'should have Evented properties');
  })
});

test("it defines `transform`", function() {
  ok(source.transform, 'should define `transform`');
});

test("it requires the definition of `_transform`", function() {
  throws(source.transform, "presence of `_transform` should be verified");
});

test("`transform` returns the value of `_transform`", function() {
  source._transform = successfulOperation;

  stop();
  source.transform().then(function(result) {
    equal(result, ':)', 'tranform returns the same value as _tranform');
    start();
  });
});

test("it should emit `willTransform` and `didTransform` events for a successful transform", function() {
  expect(8);

  var order = 0;

  source.on('willTransform', function() {
    equal(++order, 1, 'willTransform emitted first');
    deepEqual(toArray(arguments), ['abc', 'def'], 'event handler args match original call args');
  });

  source._transform = function() {
    equal(++order, 2, '_transform called next');
    deepEqual(toArray(arguments), ['abc', 'def'], '_transform args match original call args');
    return successfulOperation();
  };

  source.on('didTransform', function() {
    equal(++order, 3, 'didTransform emitted after transform performed successfully');
    deepEqual(toArray(arguments), ['abc', 'def', ':)'], 'event handler args match original call args + return value');
  });

  stop();
  source.transform.call(source, 'abc', 'def').then(function(result) {
    start();
    equal(++order, 4, 'promise resolved last');
    equal(result, ':)', 'success!');
  });
});

test("it should emit `willTransform` and `didNotTransform` events for an unsuccessful transform", function() {
  expect(8);

  var order = 0;

  source.on('willTransform', function() {
    equal(++order, 1, 'willTransform emitted first');
    deepEqual(toArray(arguments), ['abc', 'def'], 'event handler args match original call args');
  });

  source._transform = function() {
    equal(++order, 2, '_transform called next');
    deepEqual(toArray(arguments), ['abc', 'def'], '_transform args match original call args');
    return failedOperation();
  };

  source.on('didTransform', function() {
    ok(false, 'didTransform should not be triggered');
  });

  source.on('didNotTransform', function() {
    equal(++order, 3, 'didNotTransform emitted after transform could not be performed successfully');
    deepEqual(toArray(arguments), ['abc', 'def', ':('], 'event handler args match original call args + return value');
  });

  stop();
  source.transform.call(source, 'abc', 'def').then(null, function(result) {
    start();
    equal(++order, 4, 'promise resolved last');
    equal(result, ':(', 'failure');
  });
});
