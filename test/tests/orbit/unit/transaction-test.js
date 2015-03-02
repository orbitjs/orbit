import Orbit from 'orbit/main';
import Transaction from 'orbit/transaction';
import Operation from 'orbit/operation';
import Evented from 'orbit/evented';
import { Class } from 'orbit/lib/objects';
import { Promise, all } from 'rsvp';

///////////////////////////////////////////////////////////////////////////////

var Source;
var target;

module("Orbit - Transaction", {
  setup: function() {
    Orbit.Promise = Promise;

    Source = Class.extend({
      init: function() {
        Evented.extend(this);
      }
    });

    target = new Source({
      _transform: function() {
      }
    });
  },

  teardown: function() {
    Orbit.Promise = null;
  }
});

test("it exists", function() {
  var transaction = new Transaction(target);
  ok(transaction);
});
