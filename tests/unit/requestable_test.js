import Requestable from 'orbit/requestable';

var requestable;

module("Unit - Requestable", {
  setup: function() {
    requestable = {};
    Requestable.extend(requestable);
  },

  teardown: function() {
    requestable = null;
  }
});

test("it exists", function() {
  ok(requestable);
});

test("it defines the required actions", function() {
  ['find', 'create', 'update', 'destroy'].forEach(function(action) {
    ok(requestable[action], "has the required action " + action);
  });
});
