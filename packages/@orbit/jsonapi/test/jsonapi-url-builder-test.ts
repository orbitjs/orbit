const { module, test } = QUnit;
import { KeyMap, Schema } from '@orbit/data';
import { JSONAPIURLBuilder } from '../src/index';
import { JSONAPISerializer } from '../src/index';

module('JSONAPIRequestProcessor', function (hooks) {
  let keyMap: KeyMap;
  let urlBuilder: JSONAPIURLBuilder;

  hooks.beforeEach(() => {
    keyMap = new KeyMap();
    let schema = new Schema({
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
    let serializer = new JSONAPISerializer({ schema, keyMap });
    urlBuilder = new JSONAPIURLBuilder({ serializer, keyMap });
    urlBuilder.serializer.resourceKey = function () {
      return 'remoteId';
    };
  });

  hooks.afterEach(() => {
    keyMap = urlBuilder = null;
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
