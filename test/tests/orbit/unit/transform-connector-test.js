import Orbit from 'orbit/main';
import Operation from 'orbit/operation';
import Transformable from 'orbit/transformable';
import TransformConnector from 'orbit/transform-connector';
import { Promise } from 'rsvp';
import { equalOps } from 'tests/test-helper';

var primarySource,
    secondarySource,
    transformConnector;

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

module("Orbit - TransformConnector", {
  setup: function() {
    Orbit.Promise = Promise;

    primarySource = {};
    Transformable.extend(primarySource);

    secondarySource = {};
    Transformable.extend(secondarySource);
  },

  teardown: function() {
    primarySource = null;
    secondarySource = null;
    transformConnector = null;

    Orbit.Promise = null;
  }
});

test("it exists", function() {
  transformConnector = new TransformConnector(primarySource, secondarySource);
  ok(transformConnector);
});

test("it is active by default exists", function() {
  transformConnector = new TransformConnector(primarySource, secondarySource);
  equal(transformConnector.isActive(), true);
});

test("it watches `didTransform` events on the source and applies them to the target", function() {
  expect(3);

  var order = 0;

  var op = new Operation({
    op: 'add',
    path: ['planet', '1', {id: 1, name: 'Earth'}]
  });

  secondarySource.retrieve = function() {
    equal(++order, 1, 'target.retrieve triggered');
    return null;
  };

  secondarySource.transform = function(operation) {
    start();
    equal(++order, 2, 'target.transform triggered');
    deepEqual(operation, op, 'target operation matches source operation');
    return successfulOperation();
  };

  transformConnector = new TransformConnector(primarySource, secondarySource);

  stop();
  primarySource.emit('didTransform', op);
});

test("it watches `didTransform` events on the source and applies them to the target", function() {
  expect(3);

  var order = 0;

  var op = new Operation({
    op: 'add',
    path: ['planet', '1'],
    value: {id: 1, name: 'Earth'}
  });

  secondarySource.retrieve = function() {
    equal(++order, 1, 'target.retrieve triggered');
    return null;
  };

  secondarySource.transform = function(operation) {
    start();
    equal(++order, 2, 'target.transform triggered');
    deepEqual(operation, op, 'target operation matches source operation');
    return successfulOperation();
  };

  transformConnector = new TransformConnector(primarySource, secondarySource);

  stop();
  primarySource.emit('didTransform', op);
});

test("for `add` operations, it applies a differential if the target path exists", function() {
  expect(5);

  var order = 0;

  var op = new Operation({
    op: 'add',
    path: ['planet', '1'],
    value: {id: 1, name: 'Earth', hasRings: false}
  });

  secondarySource.retrieve = function() {
    equal(++order, 1, 'target.retrieve triggered');
    return {
      id: 1,
      name: 'Saturn',
      hasRings: true
    };
  };

  secondarySource.transform = function(operation) {
    start();
    equal(++order, 2, 'target.transform triggered');
    equal(operation.length, 2, 'target operation count matches');
    equalOps(operation[0], {op: 'replace', path: 'planet/1/name', value: 'Earth'}, 'first target op matches');
    equalOps(operation[1], {op: 'replace', path: 'planet/1/hasRings', value: false}, 'second target op matches');
    return successfulOperation();
  };

  transformConnector = new TransformConnector(primarySource, secondarySource);

  stop();
  primarySource.emit('didTransform', op);
});

test("for `replace` operations, it applies a differential if the target path exists", function() {
  expect(4);

  var order = 0;

  var op = new Operation({
    op: 'replace',
    path: ['planet', '1', 'hasRings'],
    value: true
  });

  secondarySource.retrieve = function() {
    equal(++order, 1, 'target.retrieve triggered');
    return false;
  };

  secondarySource.transform = function(operation) {
    start();
    equal(++order, 2, 'target.transform triggered');
    equal(operation.length, 1, 'target operation count matches');
    equalOps(operation[0], {op: 'replace', path: 'planet/1/hasRings', value: true}, 'first target op matches');
    return successfulOperation();
  };

  transformConnector = new TransformConnector(primarySource, secondarySource);

  stop();
  primarySource.emit('didTransform', op);
});

/*
 TODO - tests needed

 - filterFunction
 - activate / deactivate
 - queueing
 - blocking vs. non-blocking
*/
