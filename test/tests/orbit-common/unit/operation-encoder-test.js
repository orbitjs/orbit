import { Promise } from 'rsvp';
import Schema from 'orbit-common/schema';
import OperationEncoder from 'orbit-common/operation-encoder';
import Orbit from 'orbit/main';
import { op } from 'tests/test-helper';
import { OperationNotAllowed } from 'orbit-common/lib/exceptions';

var schemaDefinition = {
  models: {
    planet: {
      attributes: {
        name: {type: 'string'},
        classification: {type: 'string'}
      },
      links: {
        moons: {type: 'hasMany', model: 'moon', inverse: 'planet'}
      }
    },
    moon: {
      attributes: {
        name: {type: 'string'}
      },
      links: {
        planet: {type: 'hasOne', model: 'planet', inverse: 'moons'}
      }
    }
  }
};

var operationEncoder;

module("OC - OperationEncoder", {
  setup: function() {
    Orbit.Promise = Promise;

    var schema = new Schema(schemaDefinition);
    operationEncoder = new OperationEncoder(schema);
  },

  teardown: function(){
    operationEncoder = null;
  }
});

function identifiesAsInvalid(operation){
  try {
    operationEncoder.identify(operation);
    ok(false, "should have identified operation as invalid");
  }
  catch(exception){
    if (exception instanceof OperationNotAllowed) {
      ok(true, "invalid operation");
    } else {
      throw exception;
    }
  }
}

function identifies(operation, operationType){
  equal(
    operationEncoder.identify(operation),
    operationType,
    "identified " + operationType
  );
}

test("identifies addRecord", function(){
  identifies(op('add', 'planet/planet1', {id: 'planet1', name: "Europa"}), 'addRecord');
});

test("identifies replaceRecord", function(){
  identifies(op('replace', 'planet/planet1', {id: 'planet1', name: "Europa"}), 'replaceRecord');
});

test("identifies removeRecord", function(){
  identifies(op('remove', 'planet/planet1', {id: 'planet1', name: "Europa"}), 'removeRecord');
});

test('identifies addHasMany with populated value', function(){
  identifies(op('add', 'planet/planet1/__rel/moons', {'moon1': true, 'moon2': true}), 'addHasMany');
});

test('identifies addHasMany with empty value', function(){
  identifies(op('add', 'planet/planet1/__rel/moons', {}), 'addHasMany');
});

test('identifies addHasMany with null value as invalid', function(){
  identifiesAsInvalid(op('add', 'planet/planet1/__rel/moons', null));
});

test('identifies addHasMany with undefined value as invalid', function(){
  identifiesAsInvalid(op('add', 'planet/planet1/__rel/moons', undefined));
});

test('identifies replaceHasMany with populated value', function(){
  identifies(op('add', 'planet/planet1/__rel/moons', {'moon1': true, 'moon2': true}), 'addHasMany');
});

test('identifies replaceHasMany with null value as invalid', function(){
  identifiesAsInvalid(op('replace', 'planet/planet1/__rel/moons', null));
});

test('identifies replaceHasMany with undefined value as invalid', function(){
  identifiesAsInvalid(op('replace', 'planet/planet1/__rel/moons', undefined));
});

test('identifies removeHasMany', function(){
  identifies(op('remove', 'planet/planet1/__rel/moons'), 'removeHasMany');
});

test("identifies addToHasMany", function(){
  identifies(op('add', 'planet/planet1/__rel/moons/moon1', true), 'addToHasMany');
});

test("identifies removeFromHasMany", function(){
  identifies(op('remove', 'planet/planet1/__rel/moons/moon1'), 'removeFromHasMany');
});

test("identifies addHasOne", function(){
  identifies(op('add', 'moon/moon1/__rel/planet', 'planet1'), 'addHasOne');
});

test("identifies replaceHasOne", function(){
  identifies(op('replace', 'moon/moon1/__rel/planet', 'planet1'), 'replaceHasOne');
});

test("identifies removeHasOne", function(){
  identifies(op('remove', 'moon/moon1/__rel/planet'), 'removeHasOne');
});

test("identifies addAttribute", function(){
  identifies(op('add', 'planet/planet1/name', 'Jupiter'), 'addAttribute');
});

test("identifies replaceAttribute", function(){
  identifies(op('replace', 'planet/planet1/name', 'Jupiter'), 'replaceAttribute');
});

test("identifies removeAttribute", function(){
  identifies(op('remove', 'planet/planet1/name'), 'removeAttribute');
});

test("encodes addRecord", function(){
  var record = {id: 'planet1', name: "Europa"};

  deepEqual(
    operationEncoder.addRecordOp('planet', 'planet1', record).serialize(),
    op('add', 'planet/planet1', record).serialize()
  );
});

test("encodes replaceRecord", function(){
  var record = {id: 'planet1', name: "Europa"};

  deepEqual(
    operationEncoder.replaceRecordOp('planet', 'planet1', record).serialize(),
    op('replace', 'planet/planet1', record).serialize()
  );
});

test("encodes removeRecord", function(){
  deepEqual(
    operationEncoder.removeRecordOp('planet', 'planet1').serialize(),
    op('remove', 'planet/planet1').serialize()
  );
});

test("encodes addToHasMany", function(){
  deepEqual(
    operationEncoder.addLinkOp('planet', 'planet1', 'moons', 'moon1').serialize(),
    op('add', 'planet/planet1/__rel/moons/moon1', true).serialize()
  );
});

test("encodes replaceHasOne (via addLinkOp)", function(){
  deepEqual(
    operationEncoder.addLinkOp('moon', 'moon1', 'planet', 'planet1').serialize(),
    op('replace', 'moon/moon1/__rel/planet', 'planet1').serialize()
  );
});

test("encodes replaceHasOne (via replaceLinkOp)", function(){
  deepEqual(
    operationEncoder.replaceLinkOp('moon', 'moon1', 'planet', 'planet1').serialize(),
    op('replace', 'moon/moon1/__rel/planet', 'planet1').serialize()
  );
});

test("encodes replaceHasOne (via removeLinkOp)", function(){
  deepEqual(
    operationEncoder.removeLinkOp('moon', 'moon1', 'planet', 'planet1').serialize(),
    op('replace', 'moon/moon1/__rel/planet', null).serialize()
  );
});

test("encodes replaceHasMany", function(){
  deepEqual(
    operationEncoder.replaceLinkOp('planet', 'planet1', 'moons', ['moon1', 'moon2']).serialize(),
    op('replace', 'planet/planet1/__rel/moons', {'moon1': true, 'moon2': true}).serialize()
  );
});

test("encodes removeFromHasMany", function(){
  deepEqual(
    operationEncoder.removeLinkOp('planet', 'planet1', 'moons', 'moon1').serialize(),
    op('remove', 'planet/planet1/__rel/moons/moon1').serialize()
  );
});
