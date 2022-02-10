import {
  RecordKeyMap,
  RecordSchema,
  RecordQueryExpression,
  RecordQuery,
  RecordOperation,
  RecordTransform
} from '@orbit/records';
import { JSONAPIRequestProcessor } from '../src/jsonapi-request-processor';
import { jsonapiResponse } from './support/jsonapi';
import { SinonStub } from 'sinon';
import * as sinon from 'sinon';
import { InvalidServerResponse, ServerError } from '../src/lib/exceptions';

const { module, test } = QUnit;

module('JSONAPIRequestProcessor', function (hooks) {
  let fetchStub: SinonStub;
  let keyMap: RecordKeyMap;
  let schema: RecordSchema;
  let processor: JSONAPIRequestProcessor;

  hooks.beforeEach(() => {
    fetchStub = sinon.stub(self, 'fetch');
    schema = new RecordSchema({
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

    keyMap = new RecordKeyMap();
    processor = new JSONAPIRequestProcessor({
      schema,
      keyMap,
      sourceName: 'foo'
    });
  });

  hooks.afterEach(() => {
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

    try {
      await processor.fetch('/planets/12345/relationships/moons', {});
      assert.ok(false, 'xml is not an allowed content-type');
    } catch (e) {
      assert.equal(
        (e as InvalidServerResponse).message,
        "Invalid server response: The server responded with the content type 'application/xml', which is not allowed. Allowed content types include: 'application/vnd.api+json', 'application/json'."
      );
    }

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
    let result = await processor.fetch(
      '/planets/12345/relationships/moons',
      {}
    );
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
    assert.strictEqual(
      result.document,
      undefined,
      'A 204 - No Content response has no content'
    );
  });

  test('#fetch - throws an error if the server returns an error response', async function (assert) {
    assert.expect(4);

    fetchStub.withArgs('/planets/UNAUTHORIZED-1').returns(
      jsonapiResponse(
        {
          status: 401,
          headers: {
            'Content-Type': 'application/vnd.api+json'
          }
        },
        {
          errors: []
        }
      )
    );

    try {
      await processor.fetch('/planets/UNAUTHORIZED-1', {});
      assert.ok(false, 'should not be successful');
    } catch (e) {
      assert.equal((e as ServerError).response?.status, 401);
      assert.deepEqual(
        (e as ServerError).data,
        { errors: [] },
        'error includes parsed response data because its content type is recognized'
      );
    }

    fetchStub.withArgs('/planets/UNAUTHORIZED-2').returns(
      jsonapiResponse(
        {
          status: 401,
          headers: {
            'Content-Type': 'application/xml' // unrecognized type
          }
        },
        {
          bogus: {}
        }
      )
    );

    try {
      await processor.fetch('/planets/UNAUTHORIZED-2', {});
      assert.ok(false, 'should not be successful');
    } catch (e) {
      assert.equal((e as ServerError).response?.status, 401);
      assert.strictEqual(
        (e as ServerError).data,
        undefined,
        'xml is not an allowed content-type and cannot be parsed as `data`, but an error response should still be returned'
      );
    }
  });

  test('#mergeRequestOptions', function (assert) {
    const queryExpression: RecordQueryExpression = {
      op: 'findRecord',
      record: { type: 'planet', id: 'p1' },
      options: {
        url: 'url2',
        sources: {
          foo: {
            page: { kind: 'offsetLimit', offset: 2 }
          }
        }
      }
    };
    const query: RecordQuery = {
      id: '1',
      expressions: [queryExpression],
      options: {
        sort: 'sort',
        url: 'url',
        sources: {
          foo: {
            page: 'page',
            include: 'include'
          }
        }
      }
    };
    const operation: RecordOperation = {
      op: 'addRecord',
      record: { type: 'planet', id: 'p1' },
      options: {
        url: 'url2',
        sources: {
          foo: {
            page: { kind: 'offsetLimit', offset: 2 }
          }
        }
      }
    };
    const transform: RecordTransform = {
      id: '1',
      operations: [operation],
      options: {
        sort: 'sort',
        url: 'url',
        sources: {
          foo: {
            page: 'page',
            include: 'include'
          }
        }
      }
    };

    assert.deepEqual(
      processor.mergeRequestOptions([query.options, queryExpression.options]),
      {
        sort: 'sort',
        include: 'include',
        page: { kind: 'offsetLimit', offset: 2 },
        url: 'url2'
      }
    );
    assert.deepEqual(
      processor.mergeRequestOptions([transform.options, operation.options]),
      {
        sort: 'sort',
        include: 'include',
        page: { kind: 'offsetLimit', offset: 2 },
        url: 'url2'
      }
    );
  });
});
