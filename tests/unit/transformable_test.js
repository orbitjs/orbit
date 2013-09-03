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

['insertObject', 'replaceObject', 'setProperty', 'removeObject'].forEach(function(actionName) {
  var ActionName = actionName.charAt(0).toUpperCase() + actionName.slice(1);

  test("it should define perform" + ActionName, function() {
    transformable['perform' + ActionName] = successfulOperation;

    transformable[actionName].call(transformable).then(function() {
      ok(true, 'perform' + ActionName + ' promise resolved')
    });
  });

  test("it should trigger `will" + ActionName + "` and `did" + ActionName + "` events around a successful action", function() {
    expect(4);

    var order = 0;

    transformable['perform' + ActionName] = function() {
      equal(order++, 1, 'action performed after will' + ActionName);
      return successfulOperation();
    };

    transformable.on('will' + ActionName, function() {
      equal(order++, 0, 'will' + ActionName + ' triggered first');
    });

    transformable.on('did' + ActionName, function() {
      equal(order++, 2, 'did' + ActionName + ' triggered after action performed');
    });

    transformable[actionName].call(transformable).then(function() {
      equal(order++, 3, 'promise resolved after did' + ActionName);
    });
  });

  test("it should trigger `will" + ActionName + "`, but not `did" + ActionName + "`, events for an unsuccessful action", function() {
    expect(3);

    var order = 0;

    transformable['perform' + ActionName] = function() {
      equal(order++, 1, 'action performed after will' + ActionName);
      return failedOperation();
    };

    transformable.on('will' + ActionName, function() {
      equal(order++, 0, 'will' + ActionName + ' triggered first');
    });

    transformable.on('did' + ActionName, function() {
      ok(false, 'did' + ActionName + ' should not be triggered');
    });

    transformable[actionName].call(transformable).then(null, function() {
      equal(order++, 2, 'promise resolved after did' + ActionName);
    });
  });
});
//
//test("it should define performInsertObject", function() {
//  transformable.performInsertObject = successfulOperation;
//
//  transformable.insertObject().then(function() {
//    ok(true, 'performInsertObject promise resolved')
//  });
//});
