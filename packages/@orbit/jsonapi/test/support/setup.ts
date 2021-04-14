import { RecordSchema } from '@orbit/records';

export function createSchemaWithRemoteKey(): RecordSchema {
  return new RecordSchema({
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
          },
          moons: {
            kind: 'hasMany',
            type: 'moon',
            inverse: 'solarSystem'
          }
        }
      }
    }
  });
}

export function createSchemaWithoutKeys(): RecordSchema {
  return new RecordSchema({
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
          },
          moons: {
            kind: 'hasMany',
            type: 'moon',
            inverse: 'solarSystem'
          }
        }
      }
    }
  });
}
