import { equalOps, successfulOperation, failedOperation } from 'tests/test-helper';
import Orbit from 'orbit/main';
import Operation from 'orbit/operation';
import Transform from 'orbit/transform';
import Transformable from 'orbit/transformable';
import TransformConnector from 'orbit/transform-connector';
import { Class } from 'orbit/lib/objects';
import { Promise } from 'rsvp';

var primarySource,
    secondarySource,
    transformConnector;

///////////////////////////////////////////////////////////////////////////////

module('Orbit - TransformConnector', {
  setup: function() {
    let Source = Class.extend(Transformable);

    primarySource = new Source();
    secondarySource = new Source();
  },

  teardown: function() {
    primarySource = null;
    secondarySource = null;
    transformConnector = null;
  }
});

test('it exists', function() {
  transformConnector = new TransformConnector(primarySource, secondarySource);
  ok(transformConnector);
});

test('it is active by default exists', function() {
  transformConnector = new TransformConnector(primarySource, secondarySource);
  equal(transformConnector.isActive(), true);
});

test('it watches `transform` events on the source and applies them to the target', function() {
  expect(1);

  let addPlanet = new Transform([{
    op: 'add',
    path: ['planet', '1'],
    value: { id: 1, name: 'Earth' }
  }]);

  secondarySource._transform = function(transform) {
    start();

    equalOps(transform.operations, addPlanet.operations, 'target operation matches source operation');

    return successfulOperation();
  };

  transformConnector = new TransformConnector(primarySource, secondarySource);

  stop();
  primarySource.transformed(addPlanet);
});


/*
 TODO - tests needed

 - shouldTransform
 - activate / deactivate
 - blocking vs. non-blocking
*/
