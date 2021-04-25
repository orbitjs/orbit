import { JSONAPIResourceFieldSerializer } from '../../src/serializers/jsonapi-resource-field-serializer';

const { module, test } = QUnit;

module('JSONAPIResourceFieldSerializer', function (hooks) {
  test('it exists', function (assert) {
    let serializer = new JSONAPIResourceFieldSerializer();
    assert.ok(serializer);
  });

  module('with no options', function (hooks) {
    let serializer: JSONAPIResourceFieldSerializer;

    hooks.beforeEach(function () {
      serializer = new JSONAPIResourceFieldSerializer();
    });

    test('#serialize returns arg untouched', function (assert) {
      assert.equal(serializer.serialize('abc'), 'abc');
    });

    test('#deserialize returns arg untouched', function (assert) {
      assert.equal(serializer.deserialize('abc'), 'abc');
    });
  });

  module(
    "serializationOptions: { inflectors: ['pluralize', 'dasherize'] }",
    function (hooks) {
      let serializer: JSONAPIResourceFieldSerializer;

      hooks.beforeEach(function () {
        serializer = new JSONAPIResourceFieldSerializer({
          serializationOptions: { inflectors: ['pluralize', 'dasherize'] }
        });
      });

      test('#serialize pluralizes + dasherizes strings', function (assert) {
        assert.equal(serializer.serialize('planet'), 'planets');
        assert.equal(serializer.serialize('mixedCase'), 'mixed-cases');
        assert.equal(serializer.serialize('moon_shadow'), 'moon-shadows');
      });

      test('#deserialize camelizes + singularizes strings', function (assert) {
        assert.equal(serializer.deserialize('planets'), 'planet');
        assert.equal(serializer.deserialize('mixed-cases'), 'mixedCase');
        assert.equal(serializer.deserialize('moon-shadows'), 'moonShadow');
      });
    }
  );
});
