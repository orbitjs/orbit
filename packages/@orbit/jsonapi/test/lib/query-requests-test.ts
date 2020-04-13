import { Schema, QueryBuilder, buildQuery } from '@orbit/data';
import {
  QueryRequestProcessors,
  getQueryRequests
} from '../../src/lib/query-requests';
import JSONAPIRequestProcessor from '../../src/jsonapi-request-processor';
import { SinonStatic, SinonStub } from 'sinon';
import { jsonapiResponse } from '../support/jsonapi';

declare const sinon: SinonStatic;
const { module, test } = QUnit;

module('QueryRequests', function (hooks) {
  let schema: Schema;
  let requestProcessor: JSONAPIRequestProcessor;
  let qb: QueryBuilder;
  let fetchStub: SinonStub;

  hooks.beforeEach(() => {
    fetchStub = sinon.stub(self, 'fetch');

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

    requestProcessor = new JSONAPIRequestProcessor({
      keyMap: null,
      schema,
      sourceName: 'foo'
    });

    qb = new QueryBuilder();
  });

  hooks.afterEach(() => {
    schema = requestProcessor = null;
    fetchStub.restore();
  });

  test('meta and links', async function (assert) {
    fetchStub.withArgs('/planets').returns(
      jsonapiResponse(200, {
        data: [
          {
            type: 'planets',
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
      })
    );

    const query = buildQuery(qb.findRecords('planet'));

    const request = getQueryRequests(requestProcessor, query)[0];
    const response = await QueryRequestProcessors[request.op](
      requestProcessor,
      request
    );
    const {
      transforms: [{ id: transformId }]
    } = response;

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
      primaryData: [
        {
          attributes: {
            name: 'Jupiter'
          },
          id: 'jupiter',
          type: 'planet'
        }
      ],
      transforms: [
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
            }
          ],
          options: undefined
        }
      ]
    });
  });
});
