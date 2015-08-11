import Orbit from 'orbit/main';
import Operation from 'orbit/operation';
import Transform from 'orbit/transform';
import TransformResult from 'orbit/transform-result';
import Transformable from 'orbit/transformable';
import TransformConnector from 'orbit/transform-connector';
import { Promise } from 'rsvp';
import { equalOps, successfulOperation, failedOperation } from 'tests/test-helper';

var primarySource,
    secondarySource,
    transformConnector;

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
  expect(1);

  var appliedOps = [{
    op: 'add',
    path: ['planet', '1'],
    value: {id: 1, name: 'Earth'}
  }];

  secondarySource._transform = function(ops) {
    start();
    equalOps(ops, appliedOps, 'target operation matches source operation');
    return successfulOperation(new TransformResult(ops));
  };

  transformConnector = new TransformConnector(primarySource, secondarySource);

  stop();
  primarySource.transformed(new TransformResult(appliedOps));
});


/*
 TODO - tests needed

 - shouldTransform
 - activate / deactivate
 - blocking vs. non-blocking
*/
