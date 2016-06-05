import Orbit from 'orbit/main';
import Source from 'orbit/source';
import Transformable from 'orbit/transformable';
import Transform from 'orbit/transform';
import { TransformBuilderNotRegisteredException } from 'orbit/lib/exceptions';

let source;

///////////////////////////////////////////////////////////////////////////////

module('Orbit - Transformable', {
  setup() {
    source = new Source();
    Transformable.extend(source);
  },

  teardown() {
    source = null;
  }
});

test('it exists', function(assert) {
  assert.ok(source);
});

test('it defines `transformed`', function(assert) {
  assert.equal(typeof source.transformed, 'function', 'transformed exists');
});

test('it should require the definition of _transform', function(assert) {
  assert.throws(source._transform, 'presence of _transform should be verified');
});

test('#transform should convert non-Transforms into Transforms', function(assert) {
  assert.expect(2);

  source._transform = function(transform) {
    assert.ok(transform instanceof Transform, 'argument to _transform is a Transform');
    return Orbit.Promise.resolve([transform]);
  };

  return source.transform({ op: 'add', path: 'planet/1', value: 'data' })
    .then(() => {
      assert.ok(true, 'transformed promise resolved');
    });
});

test('#transform should throw an exception if source.transformBuilder is not registered', function(assert) {
  assert.throws(
    function() {
      source.transform(() => {});
    },
    TransformBuilderNotRegisteredException
  );
});

test('#transform should pass any transform functions to source.transformBuilder, if one is registered', function(assert) {
  assert.expect(4);

  let planet = { type: 'planet', id: '1' };

  source.transformBuilder = {
    build(b) {
      let operations = [];

      let context = {
        addRecord(record) {
          assert.strictEqual(record, planet, 'builder.addRecord called');
          operations.push({ op: 'addRecord', record: record });
        }
      };

      assert.ok(b, 'transformBuilder called');

      b(context);

      return new Transform(operations);
    }
  };

  source._transform = function(transform) {
    assert.ok(transform instanceof Transform, 'argument to _transform is a Transform');
    return Orbit.Promise.resolve([transform]);
  };

  return source.transform(
    (b) => {
      b.addRecord(planet);
    })
    .then(() => {
      assert.ok(true, 'transform promise returned');
    });
});
