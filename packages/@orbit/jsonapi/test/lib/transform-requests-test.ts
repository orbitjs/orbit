import { KeyMap, Schema, TransformBuilder, buildTransform } from '@orbit/data';
import {
  getTransformRequests,
  TransformRequestProcessors
} from '../../src/lib/transform-requests';
import { JSONAPIRequestProcessor } from '../../src/jsonapi-request-processor';
import { jsonapiResponse } from '../support/jsonapi';
import { SinonStub } from 'sinon';
import * as sinon from 'sinon';

const { module, test } = QUnit;

module('TransformRequests', function (/* hooks */) {
  module('getTransformRequests', function (hooks) {
    let keyMap: KeyMap;
    let schema: Schema;
    let requestProcessor: JSONAPIRequestProcessor;
    let tb: TransformBuilder;
    let fetchStub: SinonStub;

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
      requestProcessor = new JSONAPIRequestProcessor({
        keyMap,
        schema,
        sourceName: 'foo'
      });

      tb = new TransformBuilder();
    });

    hooks.afterEach(() => {
      schema = requestProcessor = null;
      fetchStub.restore();
    });

    test('addRecord', function (assert) {
      const jupiter = {
        type: 'planet',
        id: 'jupiter',
        attributes: { name: 'Jupiter' }
      };

      const t = buildTransform(tb.addRecord(jupiter));

      assert.deepEqual(getTransformRequests(requestProcessor, t), [
        {
          op: 'addRecord',
          record: jupiter
        }
      ]);
    });

    test('removeRecord', function (assert) {
      const jupiter = {
        type: 'planet',
        id: 'jupiter',
        attributes: { name: 'Jupiter' }
      };

      const t = buildTransform(tb.removeRecord(jupiter));

      assert.deepEqual(getTransformRequests(requestProcessor, t), [
        {
          op: 'removeRecord',
          record: { type: 'planet', id: 'jupiter' }
        }
      ]);
    });

    test('replaceAttribute => updateRecord', function (assert) {
      const t = buildTransform(
        tb.replaceAttribute({ type: 'planet', id: 'jupiter' }, 'name', 'Earth')
      );

      assert.deepEqual(getTransformRequests(requestProcessor, t), [
        {
          op: 'updateRecord',
          record: {
            type: 'planet',
            id: 'jupiter',
            attributes: { name: 'Earth' }
          }
        }
      ]);
    });

    test('updateRecord', function (assert) {
      const jupiter = {
        type: 'planet',
        id: 'jupiter',
        attributes: { name: 'Jupiter' }
      };

      const t = buildTransform(tb.updateRecord(jupiter));

      assert.deepEqual(getTransformRequests(requestProcessor, t), [
        {
          op: 'updateRecord',
          record: jupiter
        }
      ]);
    });

    test('addToRelatedRecords', function (assert) {
      const jupiter = { type: 'planet', id: 'jupiter' };
      const io = { type: 'moon', id: 'io' };

      const t = buildTransform(tb.addToRelatedRecords(jupiter, 'moons', io));

      assert.deepEqual(getTransformRequests(requestProcessor, t), [
        {
          op: 'addToRelatedRecords',
          record: jupiter,
          relationship: 'moons',
          relatedRecords: [io]
        }
      ]);
    });

    test('removeFromRelatedRecords', function (assert) {
      const jupiter = { type: 'planet', id: 'jupiter' };
      const io = { type: 'moon', id: 'io' };

      const t = buildTransform(
        tb.removeFromRelatedRecords(jupiter, 'moons', io)
      );

      assert.deepEqual(getTransformRequests(requestProcessor, t), [
        {
          op: 'removeFromRelatedRecords',
          record: jupiter,
          relationship: 'moons',
          relatedRecords: [io]
        }
      ]);
    });

    test('replaceRelatedRecord => updateRecord', function (assert) {
      const jupiter = { type: 'planet', id: 'jupiter' };
      const io = { type: 'moon', id: 'io' };

      const t = buildTransform(tb.replaceRelatedRecord(io, 'planet', jupiter));

      assert.deepEqual(getTransformRequests(requestProcessor, t), [
        {
          op: 'updateRecord',
          record: {
            type: 'moon',
            id: 'io',
            relationships: {
              planet: {
                data: { type: 'planet', id: 'jupiter' }
              }
            }
          }
        }
      ]);
    });

    test('replaceRelatedRecord (with null) => updateRecord', function (assert) {
      const io = { type: 'moon', id: 'io' };

      const t = buildTransform(tb.replaceRelatedRecord(io, 'planet', null));

      assert.deepEqual(getTransformRequests(requestProcessor, t), [
        {
          op: 'updateRecord',
          record: {
            type: 'moon',
            id: 'io',
            relationships: {
              planet: {
                data: null
              }
            }
          }
        }
      ]);
    });

    test('replaceRelatedRecords => updateRecord', function (assert) {
      const jupiter = { type: 'planet', id: 'jupiter' };
      const io = { type: 'moon', id: 'io' };
      const europa = { type: 'moon', id: 'europa' };

      const t = buildTransform(
        tb.replaceRelatedRecords(jupiter, 'moons', [io, europa])
      );

      assert.deepEqual(getTransformRequests(requestProcessor, t), [
        {
          op: 'updateRecord',
          record: {
            type: 'planet',
            id: 'jupiter',
            relationships: {
              moons: {
                data: [
                  { type: 'moon', id: 'io' },
                  { type: 'moon', id: 'europa' }
                ]
              }
            }
          }
        }
      ]);
    });

    test('addRecord + removeRecord => []', function (assert) {
      const t = buildTransform([
        tb.addRecord({
          type: 'planet',
          id: 'jupiter',
          attributes: { name: 'Earth' }
        }),
        tb.removeRecord({ type: 'planet', id: 'jupiter' })
      ]);

      assert.deepEqual(getTransformRequests(requestProcessor, t), []);
    });

    test('removeRecord + removeRecord => [removeRecord]', function (assert) {
      const t = buildTransform([
        tb.removeRecord({ type: 'planet', id: 'jupiter' }),
        tb.removeRecord({ type: 'planet', id: 'jupiter' })
      ]);

      assert.deepEqual(getTransformRequests(requestProcessor, t), [
        {
          op: 'removeRecord',
          record: { type: 'planet', id: 'jupiter' }
        }
      ]);
    });

    test('addRecord + replaceAttribute => [addRecord]', function (assert) {
      const t = buildTransform([
        tb.addRecord({
          type: 'planet',
          id: 'jupiter',
          attributes: { name: 'Earth' }
        }),
        tb.replaceAttribute(
          { type: 'planet', id: 'jupiter' },
          'atmosphere',
          'gaseous'
        )
      ]);

      assert.deepEqual(getTransformRequests(requestProcessor, t), [
        {
          op: 'addRecord',
          record: {
            type: 'planet',
            id: 'jupiter',
            attributes: { name: 'Earth', atmosphere: 'gaseous' }
          }
        }
      ]);
    });

    test('replaceAttribute + replaceAttribute => [updateRecord]', function (assert) {
      const t = buildTransform([
        tb.replaceAttribute({ type: 'planet', id: 'jupiter' }, 'name', 'Earth'),
        tb.replaceAttribute(
          { type: 'planet', id: 'jupiter' },
          'atmosphere',
          'gaseous'
        )
      ]);

      assert.deepEqual(getTransformRequests(requestProcessor, t), [
        {
          op: 'updateRecord',
          record: {
            type: 'planet',
            id: 'jupiter',
            attributes: { name: 'Earth', atmosphere: 'gaseous' }
          }
        }
      ]);
    });

    test('addToRelatedRecords + addToRelatedRecords => [addToRelatedRecords]', function (assert) {
      const jupiter = { type: 'planet', id: 'jupiter' };
      const io = { type: 'moon', id: 'io' };
      const europa = { type: 'moon', id: 'europa' };

      const t = buildTransform([
        tb.addToRelatedRecords(jupiter, 'moons', io),
        tb.addToRelatedRecords(jupiter, 'moons', europa)
      ]);

      assert.deepEqual(getTransformRequests(requestProcessor, t), [
        {
          op: 'addToRelatedRecords',
          record: jupiter,
          relationship: 'moons',
          relatedRecords: [io, europa]
        }
      ]);
    });

    test('meta and links', async function (assert) {
      fetchStub.withArgs('/planets').returns(
        jsonapiResponse(201, {
          data: {
            type: 'planet',
            id: 'jupiter',
            attributes: { name: 'Jupiter' }
          },
          meta: {
            important: true
          },
          links: {
            self: 'https://api.example.com/self',
            related: {
              href: 'https://api.example.com/related',
              meta: {
                important: true
              }
            }
          }
        })
      );

      const jupiter = {
        type: 'planet',
        id: 'jupiter',
        attributes: { name: 'Jupiter' }
      };

      const t = buildTransform(tb.addRecord(jupiter));

      const [request] = getTransformRequests(requestProcessor, t);
      const response = await TransformRequestProcessors[request.op](
        requestProcessor,
        request
      );

      assert.deepEqual(response, {
        meta: {
          important: true
        },
        links: {
          self: 'https://api.example.com/self',
          related: {
            href: 'https://api.example.com/related',
            meta: {
              important: true
            }
          }
        },
        primaryData: {
          attributes: {
            name: 'Jupiter'
          },
          id: 'jupiter',
          type: 'planet'
        },
        transforms: []
      });
    });
  });
});
