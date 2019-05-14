const { module, test } = QUnit;
import Orbit, {
  KeyMap,
  Schema
} from '@orbit/data';
import JSONAPISource from '../src/index';
import { JSONAPIRequestProcessor } from '../src/index';

module('JSONAPIRequestProcessor', function(hooks) {
  let keyMap: KeyMap;
  let schema: Schema;
  let processor: JSONAPIRequestProcessor;

  hooks.beforeEach(() => {
    schema = new Schema({
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
            moons: { type: 'hasMany', model: 'moon', inverse: 'planet' },
            solarSystem: { type: 'hasOne', model: 'solarSystem', inverse: 'planets' }
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
            planet: { type: 'hasOne', model: 'planet', inverse: 'moons' }
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
            planets: { type: 'hasMany', model: 'planet', inverse: 'solarSystem' }
          }
        }
      }
    });

    keyMap = new KeyMap();
    processor = new JSONAPIRequestProcessor({ schema, keyMap, sourceName: 'foo' });
    processor.serializer.resourceKey = function() { return 'remoteId'; };
  });

  hooks.afterEach(() => {
    keyMap = schema = processor = null;
  });

  test('it exists', function(assert) {
    assert.ok(processor);
  });

  test('processor has default settings', function(assert) {
    assert.deepEqual(processor.allowedContentTypes, ['application/vnd.api+json', 'application/json'], 'allowedContentTypes are set to default');
  });

  test('#initFetchSettings will override defaults with custom settings provided', function(assert) {
    assert.deepEqual(
      processor.initFetchSettings({
        headers: {
          Accept: 'application/json'
        },
        method: 'POST',
        body: '{"data": {}}',
        timeout: 10000
      }),
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/vnd.api+json'
        },
        method: 'POST',
        body: '{"data": {}}',
        timeout: 10000
      });
  });

  test('#initFetchSettings will convert json to a stringified body', function(assert) {
    assert.deepEqual(
      processor.initFetchSettings({
        headers: {
          Accept: 'application/json'
        },
        method: 'POST',
        json: { data: { a: 123 } },
        timeout: 10000
      }),
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/vnd.api+json'
        },
        method: 'POST',
        body: '{"data":{"a":123}}',
        timeout: 10000
      });
  });

  test('#initFetchSettings will not include a `Content-Type` header with no body', function(assert) {
    assert.deepEqual(
      processor.initFetchSettings({
        method: 'GET'
      }),
      {
        headers: {
          Accept: 'application/vnd.api+json'
        },
        method: 'GET',
        timeout: 5000
      });
  });


  test('#responseHasContent - returns true if one of the `allowedContentTypes` appears anywhere in `Content-Type` header', function(assert) {
    let response = new Orbit.globals.Response('{ data: null }', { headers: { 'Content-Type': 'application/vnd.api+json' } });
    assert.equal(processor.responseHasContent(response), true, 'Accepts content that is _only_ the JSONAPI media type.');

    response = new Orbit.globals.Response('{ data: null }', { headers: { 'Content-Type': 'multipart,application/vnd.api+json; charset=utf-8' } });
    assert.equal(processor.responseHasContent(response), true, 'Position of JSONAPI media type is not important.');

    response = new Orbit.globals.Response('{ data: null }', { headers: { 'Content-Type': 'application/json' } });
    assert.equal(processor.responseHasContent(response), true, 'Source will attempt to parse plain json.');

    response = new Orbit.globals.Response('{ data: null }', { headers: { 'Content-Type': 'application/xml' } });
    assert.equal(processor.responseHasContent(response), false, 'XML is not acceptable.');

    processor.allowedContentTypes = ['application/custom'];
    response = new Orbit.globals.Response('{ data: null }', { headers: { 'Content-Type': 'application/custom' } });
    assert.equal(processor.responseHasContent(response), true, 'Source will accept custom content type if specifically allowed.');
  });

  test('#responseHasContent - returns false if response has status code 204', function(assert) {
    let response = new Orbit.globals.Response(null, { status: 204, headers: { 'Content-Type': 'application/vnd.api+json' } });

    assert.equal(processor.responseHasContent(response), false, 'A 204 - No Content response has no content.');
  });

  test('#resourceURL - respects options to construct URLs', function(assert) {
    assert.expect(1);
    processor.host = 'http://127.0.0.1:8888';
    processor.namespace = 'api';
    keyMap.pushRecord({ type: 'planet', id: '1', keys: { remoteId: 'a' }, attributes: { name: 'Jupiter' } });

    assert.equal(processor.resourceURL('planet', '1'), 'http://127.0.0.1:8888/api/planets/a', 'resourceURL method should use the options to construct URLs');
  });

  test('#resourcePath - returns resource\'s path without its host and namespace', function(assert) {
    assert.expect(1);
    processor.host = 'http://127.0.0.1:8888';
    processor.namespace = 'api';
    keyMap.pushRecord({ type: 'planet', id: '1', keys: { remoteId: 'a' }, attributes: { name: 'Jupiter' } });

    assert.equal(processor.resourcePath('planet', '1'), 'planets/a', 'resourcePath returns the path to the resource relative to the host and namespace');
  });

  test('#resourceRelationshipURL - constructs relationship URLs based upon base resourceURL', function(assert) {
    assert.expect(1);
    keyMap.pushRecord({ type: 'planet', id: '1', keys: { remoteId: 'a' }, attributes: { name: 'Jupiter' } });

    assert.equal(processor.resourceRelationshipURL('planet', '1', 'moons'), '/planets/a/relationships/moons', 'resourceRelationshipURL appends /relationships/[relationship] to resourceURL');
  });

});
