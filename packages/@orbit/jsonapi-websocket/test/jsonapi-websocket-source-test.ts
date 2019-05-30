import Orbit, {
  ClientError,
  KeyMap,
  NetworkError,
  Record,
  RecordIdentity,
  UpdateRecordOperation,
  TransformNotAllowed,
  Schema,
  Source,
  SchemaSettings,
  ReplaceKeyOperation,
  RecordOperation,
  ReplaceRelatedRecordOperation,
  ReplaceRelatedRecordsOperation,
  Transform
} from '@orbit/data';
import JSONAPIWebSocketSource from '../src/index';

import { Server } from 'mock-socket';
const socketURL = 'ws://localhost:8080';

const { module, test } = QUnit;

module('JSONAPIWebSocketSource', function() {
  let server: Server;
  let keyMap: KeyMap;
  let schema: Schema;
  let source: JSONAPIWebSocketSource;

  module('with a secondary key', function(hooks) {
    hooks.beforeEach(() => {
      server = new Server(socketURL);

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
              solarSystem: {
                type: 'hasOne',
                model: 'solarSystem',
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
              planets: {
                type: 'hasMany',
                model: 'planet',
                inverse: 'solarSystem'
              }
            }
          }
        }
      });

      keyMap = new KeyMap();
      source = new JSONAPIWebSocketSource({ url: socketURL, schema, keyMap });
    });

    hooks.afterEach(() => {
      keyMap = schema = source = null;

      server.stop();
    });

    test('it exists', function(assert) {
      assert.ok(source);
    });

    test('its prototype chain is correct', function(assert) {
      assert.ok(source instanceof Source, 'instanceof Source');
    });

    // test('source has default settings', function(assert) {
    //   assert.expect(2);

    //   let schema = new Schema({} as SchemaSettings);
    //   source = new JSONAPIWebSocketSource({ schema });
    //   assert.equal(source.name, 'jsonapi', 'name is set to default');
    //   assert.deepEqual(
    //     source.allowedContentTypes,
    //     ['application/vnd.api+json', 'application/json'],
    //     'allowedContentTypes are set to default'
    //   );
    // });
  });
});
