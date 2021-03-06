import { RecordKeyMap, RecordSchema } from '@orbit/records';
import { JSONAPIURLBuilder } from '../src/jsonapi-url-builder';
import { buildJSONAPISerializerFor } from '../src/serializers/jsonapi-serializer-builder';

const { module, test } = QUnit;

module('JSONAPIURLBuilder', function (hooks) {
  let keyMap: RecordKeyMap;
  let urlBuilder: JSONAPIURLBuilder;

  hooks.beforeEach(() => {
    keyMap = new RecordKeyMap();
    let schema = new RecordSchema({
      models: {
        planet: {
          keys: {
            remoteId: {}
          },
          attributes: {
            name: { type: 'string' },
            classification: { type: 'string' },
            lengthOfDay: { type: 'number' }
          },
          relationships: {
            moons: { kind: 'hasMany', type: 'moon', inverse: 'planet' },
            solarSystem: {
              kind: 'hasOne',
              type: 'solarSystem',
              inverse: 'planets'
            }
          }
        },
        moon: {
          keys: {
            remoteId: {}
          },
          attributes: {
            name: { type: 'string' }
          },
          relationships: {
            planet: { kind: 'hasOne', type: 'planet', inverse: 'moons' }
          }
        },
        solarSystem: {
          keys: {
            remoteId: {}
          },
          attributes: {
            name: { type: 'string' }
          },
          relationships: {
            planets: {
              kind: 'hasMany',
              type: 'planet',
              inverse: 'solarSystem'
            }
          }
        }
      }
    });
    let serializerFor = buildJSONAPISerializerFor({
      schema,
      keyMap
    });
    urlBuilder = new JSONAPIURLBuilder({ serializerFor, keyMap });
  });

  test('it exists', function (assert) {
    assert.ok(urlBuilder);
  });

  test('#resourceURL - respects options to construct URLs', function (assert) {
    assert.expect(1);
    urlBuilder.host = 'http://127.0.0.1:8888';
    urlBuilder.namespace = 'api';
    keyMap.pushRecord({
      type: 'planet',
      id: '1',
      keys: { remoteId: 'a' },
      attributes: { name: 'Jupiter' }
    });

    assert.equal(
      urlBuilder.resourceURL('planet', '1'),
      'http://127.0.0.1:8888/api/planets/a',
      'resourceURL method should use the options to construct URLs'
    );
  });

  test("#resourcePath - returns resource's path without its host and namespace", function (assert) {
    assert.expect(1);
    urlBuilder.host = 'http://127.0.0.1:8888';
    urlBuilder.namespace = 'api';
    keyMap.pushRecord({
      type: 'planet',
      id: '1',
      keys: { remoteId: 'a' },
      attributes: { name: 'Jupiter' }
    });

    assert.equal(
      urlBuilder.resourcePath('planet', '1'),
      'planets/a',
      'resourcePath returns the path to the resource relative to the host and namespace'
    );
  });

  test('#resourceRelationshipURL - constructs relationship URLs based upon base resourceURL', function (assert) {
    assert.expect(1);
    keyMap.pushRecord({
      type: 'planet',
      id: '1',
      keys: { remoteId: 'a' },
      attributes: { name: 'Jupiter' }
    });

    assert.equal(
      urlBuilder.resourceRelationshipURL('planet', '1', 'moons'),
      '/planets/a/relationships/moons',
      'resourceRelationshipURL appends /relationships/[relationship] to resourceURL'
    );
  });
});
