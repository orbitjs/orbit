import {
  RecordOperation,
  RecordSchema,
  RecordQueryBuilder
} from '@orbit/records';
import { buildQuery } from '@orbit/data';
import {
  QueryRequestProcessors,
  getQueryRequests
} from '../../src/lib/query-requests';
import { JSONAPIRequestProcessor } from '../../src/jsonapi-request-processor';
import { jsonapiResponse } from '../support/jsonapi';
import { SinonStub } from 'sinon';
import * as sinon from 'sinon';

const { module, test } = QUnit;

module('QueryRequests', function (hooks) {
  let schema: RecordSchema;
  let requestProcessor: JSONAPIRequestProcessor;
  let qb: RecordQueryBuilder;
  let fetchStub: SinonStub;

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

    requestProcessor = new JSONAPIRequestProcessor({
      keyMap: undefined,
      schema,
      sourceName: 'foo'
    });

    qb = new RecordQueryBuilder();
  });

  hooks.afterEach(() => {
    fetchStub.restore();
  });

  test('meta and links', async function (assert) {
    const responseJson = {
      data: [
        {
          type: 'planet',
          id: 'jupiter',
          attributes: { name: 'Jupiter' }
        }
      ],
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
    };

    fetchStub.withArgs('/planets').returns(jsonapiResponse(200, responseJson));

    const query = buildQuery(qb.findRecords('planet'));

    const request = getQueryRequests(requestProcessor, query)[0];
    const response = await QueryRequestProcessors[request.op](
      requestProcessor,
      request
    );
    const transformId = response.transforms?.[0].id as string;

    assert.deepEqual(response.data, [
      {
        attributes: {
          name: 'Jupiter'
        },
        id: 'jupiter',
        type: 'planet'
      }
    ]);

    assert.deepEqual(response.details?.document, responseJson);

    assert.deepEqual(response.transforms, [
      {
        id: transformId,
        operations: [
          {
            op: 'updateRecord',
            record: {
              type: 'planet',
              id: 'jupiter',
              attributes: { name: 'Jupiter' }
            }
          } as RecordOperation
        ],
        options: undefined
      }
    ]);
  });
});
