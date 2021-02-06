import {
  RecordKeyMap,
  RecordSchema,
  RecordSchemaSettings,
  RecordSource
} from '@orbit/records';
import { JSONAPIResourceSerializer } from '../src';
import { JSONAPISource } from '../src/jsonapi-source';
import { JSONAPISerializers } from '../src/serializers/jsonapi-serializers';
import { createSchemaWithRemoteKey } from './support/setup';
import * as sinon from 'sinon';
import { SinonStub } from 'sinon';

const { module, test } = QUnit;

module('JSONAPISource', function (hooks) {
  let fetchStub: SinonStub;
  let keyMap: RecordKeyMap;
  let schema: RecordSchema;
  let source: JSONAPISource;
  let resourceSerializer: JSONAPIResourceSerializer;

  hooks.beforeEach(() => {
    fetchStub = sinon.stub(self, 'fetch');

    schema = createSchemaWithRemoteKey();
    keyMap = new RecordKeyMap();
    source = new JSONAPISource({
      schema,
      keyMap
    });
    resourceSerializer = source.requestProcessor.serializerFor(
      JSONAPISerializers.Resource
    ) as JSONAPIResourceSerializer;
  });

  hooks.afterEach(() => {
    fetchStub.restore();
  });

  test('it exists', function (assert) {
    assert.ok(source);
  });

  test('its prototype chain is correct', function (assert) {
    assert.ok(source instanceof RecordSource, 'instanceof RecordSource');
  });

  test('source has default settings', function (assert) {
    let schema = new RecordSchema({} as RecordSchemaSettings);
    source = new JSONAPISource({ schema });
    assert.equal(source.name, 'jsonapi', 'name is set to default');
    assert.deepEqual(
      source.requestProcessor.allowedContentTypes,
      ['application/vnd.api+json', 'application/json'],
      'allowedContentTypes are set to default'
    );
    assert.deepEqual(
      source.defaultQueryOptions,
      {
        parallelRequests: true
      },
      'defaultQueryOptions matches expectation'
    );
    assert.deepEqual(
      source.defaultTransformOptions,
      {},
      'defaultTransformOptions matches expectation'
    );
  });

  test('source saves options', function (assert) {
    assert.expect(4);

    let schema = new RecordSchema({} as RecordSchemaSettings);
    source = new JSONAPISource({
      schema,
      keyMap,
      host: '127.0.0.1:8888',
      name: 'custom',
      namespace: 'api',
      allowedContentTypes: ['application/custom'],
      defaultFetchSettings: {
        headers: { 'User-Agent': 'CERN-LineMode/2.15 libwww/2.17b3' }
      }
    });
    assert.equal(source.name, 'custom', 'name is custom');
    assert.deepEqual(
      source.requestProcessor.allowedContentTypes,
      ['application/custom'],
      'allowedContentTypes are custom'
    );
    assert.equal(
      source.requestProcessor.urlBuilder.resourceNamespace(),
      'api',
      'Default namespace should be used by default'
    );
    assert.equal(
      source.requestProcessor.urlBuilder.resourceHost(),
      '127.0.0.1:8888',
      'Default host should be used by default'
    );
  });

  test('#defaultFetchSettings - include JSONAPI Accept and Content-Type headers and a 5000ms timeout by default', function (assert) {
    assert.deepEqual(source.requestProcessor.defaultFetchSettings, {
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
      },
      timeout: 5000
    });
  });

  test('#defaultFetchSettings can be passed and will override any defaults set', function (assert) {
    let customSource = new JSONAPISource({
      schema,
      defaultFetchSettings: {
        headers: {
          Accept: 'application/json'
        },
        timeout: 0
      }
    });
    assert.deepEqual(customSource.requestProcessor.defaultFetchSettings, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/vnd.api+json'
      },
      timeout: 0
    });
  });
});
