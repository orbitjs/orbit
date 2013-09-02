import Transformable from 'orbit/transformable';
import RSVP from 'rsvp';

var transformable;

var successfulOperation = function() {
  stop();
  return new RSVP.Promise(function(resolve, reject) {
    start();
    resolve();
  });
};

var failedOperation = function() {
  stop();
  return new RSVP.Promise(function(resolve, reject) {
    start();
    reject();
  });
};

module("Unit - Transformable", {
  setup: function() {
    transformable = {};
    Transformable.extend(transformable);
  },

  teardown: function() {
    transformable = null;
  }
});

test("it exists", function() {
  ok(transformable);
});

test("it should define performInsertObject", function() {
  transformable.performInsertObject = successfulOperation;

  transformable.insertObject().then(function() {
    ok(true, 'performInsertObject promise resolved')
  });
});

test("it should trigger `willInsertObject` and `didInsertObject` events around a successful action", function() {
  expect(4);

  var order = 0;

  transformable.performInsertObject = function() {
    equal(order++, 1, 'action performed after willInsertObject');
    return successfulOperation();
  };

  transformable.on('willInsertObject', function() {
    equal(order++, 0, 'willInsertObject triggered first');
  });

  transformable.on('didInsertObject', function() {
    equal(order++, 2, 'didInsertObject triggered after action performed');
  });

  transformable.insertObject().then(function() {
    equal(order++, 3, 'promise resolved after didInsertObject');
  });
});

test("it should trigger `willInsertObject`, but not `didInsertObject`, events for an unsuccessful action", function() {
  expect(3);

  var order = 0;

  transformable.performInsertObject = function() {
    equal(order++, 1, 'action performed after willInsertObject');
    return failedOperation();
  };

  transformable.on('willInsertObject', function() {
    equal(order++, 0, 'willInsertObject triggered first');
  });

  transformable.on('didInsertObject', function() {
    ok(false, 'didInsertObject should not be triggered');
  });

  transformable.insertObject().then(null, function() {
    equal(order++, 2, 'promise resolved after didInsertObject');
  });
});
