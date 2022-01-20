import { PageSpecifier, RecordKeyMap, RecordSchema } from '@orbit/records';
import { buildSerializerSettingsFor } from '@orbit/serializers';
import { JSONAPIURLBuilder } from '../src/jsonapi-url-builder';
import { buildJSONAPISerializerFor } from '../src/serializers/jsonapi-serializer-builder';
import { JSONAPISerializers } from '../src/serializers/jsonapi-serializers';

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
      keyMap,

      // Specify custom dasherization of params to be sure that it's being applied
      serializerSettingsFor: buildSerializerSettingsFor({
        settingsByType: {
          [JSONAPISerializers.ResourceFieldParam]: {
            serializationOptions: { inflectors: ['dasherize'] }
          },
          [JSONAPISerializers.ResourceTypeParam]: {
            serializationOptions: { inflectors: ['dasherize'] }
          }
        }
      })
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

  test('#relatedResourceURL - respects options to construct URLs', function (assert) {
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
      urlBuilder.relatedResourceURL('planet', '1', 'solarSystem'),
      'http://127.0.0.1:8888/api/planets/a/solar-system',
      'relatedResourceURL method should use the options to construct URLs'
    );
  });

  test('#buildFilterParam translates standard filter specifiers to filter params', function (assert) {
    assert.deepEqual(
      urlBuilder.buildFilterParam([
        { kind: 'attribute', op: 'equal', attribute: 'name', value: 'Jupiter' }
      ]),
      [{ name: 'Jupiter' }]
    );
    assert.deepEqual(
      urlBuilder.buildFilterParam([
        { kind: 'attribute', op: 'equal', attribute: 'name', value: 'Jupiter' },
        { kind: 'attribute', op: 'equal', attribute: 'lengthOfDay', value: 3 }
      ]),
      [{ name: 'Jupiter' }, { 'length-of-day': 3 }]
    );
    assert.deepEqual(
      urlBuilder.buildFilterParam([
        { kind: 'attribute', op: 'equal', attribute: 'name', value: null }
      ]),
      [{ name: null }]
    );
    assert.deepEqual(
      urlBuilder.buildFilterParam([
        { kind: 'attribute', op: 'equal', attribute: 'name', value: undefined }
      ]),
      [{ name: null }]
    );

    assert.deepEqual(
      urlBuilder.buildFilterParam([
        {
          kind: 'relatedRecord',
          op: 'equal',
          relation: 'solarSystem',
          record: null
        }
      ]),
      [{ 'solar-system': null }]
    );
    assert.deepEqual(
      urlBuilder.buildFilterParam([
        {
          kind: 'relatedRecord',
          op: 'equal',
          relation: 'solarSystem',
          record: { type: 'solarSystem', id: '1' }
        }
      ]),
      [{ 'solar-system': '1' }]
    );
    assert.deepEqual(
      urlBuilder.buildFilterParam([
        {
          kind: 'relatedRecord',
          op: 'equal',
          relation: 'solarSystem',
          record: [
            { type: 'solarSystem', id: '1' },
            { type: 'solarSystem', id: '2' }
          ]
        }
      ]),
      [{ 'solar-system': '1,2' }]
    );

    assert.deepEqual(
      urlBuilder.buildFilterParam([
        {
          kind: 'relatedRecords',
          op: 'equal',
          relation: 'moons',
          records: [{ type: 'moon', id: '1' }]
        }
      ]),
      [{ moons: '1' }]
    );
    assert.deepEqual(
      urlBuilder.buildFilterParam([
        {
          kind: 'relatedRecords',
          op: 'equal',
          relation: 'moons',
          records: [
            { type: 'moon', id: '1' },
            { type: 'moon', id: '2' }
          ]
        }
      ]),
      [{ moons: '1,2' }]
    );
  });

  test('#buildFilterParam translates a dict object to filter params', function (assert) {
    assert.deepEqual(urlBuilder.buildFilterParam({ name: 'Jupiter' }), [
      { name: 'Jupiter' }
    ]);
    assert.deepEqual(
      urlBuilder.buildFilterParam({
        name: 'Jupiter',
        lengthOfDay: 3
      }),
      [{ name: 'Jupiter' }, { 'length-of-day': 3 }]
    );
    assert.deepEqual(
      urlBuilder.buildFilterParam({
        name: 'Jupiter',
        lengthOfDay: ['gt:1', 'lte:10']
      }),
      [
        { name: 'Jupiter' },
        { 'length-of-day': 'gt:1' },
        { 'length-of-day': 'lte:10' }
      ]
    );
  });

  test('#buildSortParam translates standard sort specifiers to sort params', function (assert) {
    assert.deepEqual(
      urlBuilder.buildSortParam([
        { kind: 'attribute', attribute: 'lengthOfDay', order: 'ascending' },
        { kind: 'attribute', attribute: 'name', order: 'descending' }
      ]),
      'length-of-day,-name'
    );
  });

  test('#buildSortParam translates sort strings to sort params', function (assert) {
    assert.deepEqual(
      urlBuilder.buildSortParam(['lengthOfDay', '-name']),
      'length-of-day,-name'
    );
  });

  test('#buildSortParam interprets a single string directly as a sort param', function (assert) {
    assert.deepEqual(
      urlBuilder.buildSortParam('length-of-day,-name'),
      'length-of-day,-name'
    );
  });

  test('#buildPageParam translates standard page specifiers by stripping `kind` member', function (assert) {
    assert.deepEqual(
      urlBuilder.buildPageParam({
        kind: 'offsetLimit',
        offset: 10,
        limit: 5
      }),
      {
        offset: 10,
        limit: 5
      }
    );

    assert.deepEqual(
      urlBuilder.buildPageParam({
        kind: 'pageSize',
        page: 1,
        size: 5
      } as PageSpecifier),
      {
        page: 1,
        size: 5
      }
    );
  });

  test('#buildIncludeParam serializes an array of specifiers as an include param', function (assert) {
    assert.deepEqual(
      urlBuilder.buildIncludeParam([
        ['moons', 'planet'],
        ['solarSystem', 'galaxy']
      ]),
      'moons.planet,solar-system.galaxy'
    );

    assert.deepEqual(
      urlBuilder.buildIncludeParam(['moons.planet', 'solarSystem.galaxy']),
      'moons.planet,solar-system.galaxy'
    );
  });

  test('#buildIncludeParam interprets a single string directly as an include param', function (assert) {
    assert.deepEqual(
      urlBuilder.buildIncludeParam('moons.planet,solarSystem.galaxy'),
      'moons.planet,solarSystem.galaxy'
    );
  });

  test('#buildFieldsParam translates a dict object to fields params', function (assert) {
    assert.deepEqual(
      urlBuilder.buildFieldsParam({ planet: ['name', 'solarSystem'] }),
      { planet: 'name,solar-system' }
    );
    assert.deepEqual(
      urlBuilder.buildFieldsParam({ planet: 'name,solarSystem' }),
      { planet: 'name,solar-system' }
    );
    assert.deepEqual(
      urlBuilder.buildFieldsParam({
        planet: 'name,solarSystem',
        moon: ['name']
      }),
      { planet: 'name,solar-system', moon: 'name' }
    );
  });
});
