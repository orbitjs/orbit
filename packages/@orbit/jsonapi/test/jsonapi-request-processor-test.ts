import { KeyMap, Schema } from '@orbit/data';
import { JSONAPIRequestProcessor } from '../src/jsonapi-request-processor';
import { jsonapiResponse } from './support/jsonapi';
import { SinonStub } from 'sinon';
import * as sinon from 'sinon';

const { module, test } = QUnit;

module('JSONAPIRequestProcessor', function (hooks) {
  let fetchStub: SinonStub;
  let keyMap: KeyMap;
  let schema: Schema;
  let processor: JSONAPIRequestProcessor;

  hooks.beforeEach(() => {
    fetchStub = sinon.stub(self, 'fetch');
    schema = new Schema({
      models: {
        planet: {
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
          attributes: {
            name: { type: 'string' }
          },
          relationships: {
            planet: { kind: 'hasOne', type: 'planet', inverse: 'moons' }
          }
        },
        solarSystem: {
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

    keyMap = new KeyMap();
    processor = new JSONAPIRequestProcessor({
      schema,
      keyMap,
      sourceName: 'foo'
    });
  });

  hooks.afterEach(() => {
    keyMap = schema = processor = null;
    fetchStub.restore();
  });

  test('it exists', function (assert) {
    assert.ok(processor);
  });

  test('processor has default settings', function (assert) {
    assert.deepEqual(
      processor.allowedContentTypes,
      ['application/vnd.api+json', 'application/json'],
      'allowedContentTypes are set to default'
    );
  });

  test('#initFetchSettings will override defaults with custom settings provided', function (assert) {
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
      }
    );
  });

  test('#initFetchSettings will convert json to a stringified body', function (assert) {
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
      }
    );
  });

  test('#initFetchSettings will not include a `Content-Type` header with no body', function (assert) {
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
      }
    );
  });

  test('#fetch - successful if one of the `allowedContentTypes` appears anywhere in `Content-Type` header', async function (assert) {
    assert.expect(6);
    fetchStub.withArgs('/planets/12345/relationships/moons').returns(
      jsonapiResponse(
        {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.api+json'
          }
        },
        { data: null }
      )
    );
    try {
      let result = await processor.fetch(
        '/planets/12345/relationships/moons',
        {}
      );
      assert.ok(
        result,
        'Accepts content that is _only_ the JSONAPI media type'
      );
    } catch (e) {
      assert.ok(
        false,
        'Should accept content that is _only_ the JSONAPI media type'
      );
    }

    fetchStub.withArgs('/planets/12345/relationships/moons').returns(
      jsonapiResponse(
        {
          status: 200,
          headers: {
            'Content-Type': 'multipart,application/vnd.api+json; charset=utf-8'
          }
        },
        { data: null }
      )
    );
    try {
      let result = await processor.fetch(
        '/planets/12345/relationships/moons',
        {}
      );
      assert.ok(result, 'Position of JSONAPI media type is not important');
    } catch (e) {
      assert.ok(false, 'Position of JSONAPI media type should not matter');
    }

    fetchStub.withArgs('/planets/12345/relationships/moons').returns(
      jsonapiResponse(
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        },
        { data: null }
      )
    );
    try {
      let result = await processor.fetch(
        '/planets/12345/relationships/moons',
        {}
      );
      assert.ok(result, 'Processor will attempt to parse plain json');
    } catch (e) {
      assert.ok(false, 'Processor should parse plain json');
    }

    fetchStub.withArgs('/planets/12345/relationships/moons').returns(
      jsonapiResponse(
        {
          status: 200,
          headers: {
            'Content-Type': 'application/xml'
          }
        },
        {
          data: null
        }
      )
    );
    let result = await processor.fetch(
      '/planets/12345/relationships/moons',
      {}
    );
    assert.ok(
      result == null,
      'XML is not acceptable but HTTP Status is good, so just ignore response'
    );

    processor.allowedContentTypes = ['application/custom'];
    fetchStub.withArgs('/planets/12345/relationships/moons').returns(
      jsonapiResponse(
        {
          status: 200,
          headers: {
            'Content-Type': 'application/custom'
          }
        },
        {
          data: null
        }
      )
    );
    result = await processor.fetch('/planets/12345/relationships/moons', {});
    assert.ok(
      result,
      'will accept custom content type if specifically allowed'
    );

    fetchStub.withArgs('/planets/12345/relationships/moons').returns(
      jsonapiResponse({
        status: 204,
        headers: {
          'Content-Type': 'application/custom'
        }
      })
    );
    result = await processor.fetch('/planets/12345/relationships/moons', {});
    assert.ok(
      result === undefined,
      'A 204 - No Content response has no content'
    );
  });
});
