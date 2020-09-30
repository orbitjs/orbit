import { Schema } from '@orbit/data';

export function createSchemaWithRemoteKey(): Schema {
  return new Schema({
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

export function createSchemaWithoutKeys(): Schema {
  return new Schema({
    models: {
      planet: {
        attributes: {
          name: { type: 'string' },
          classification: { type: 'string' }
        },
        relationships: {
          moons: { kind: 'hasMany', type: 'moon', inverse: 'planet' }
        }
      },
      moon: {
        attributes: {
          name: { type: 'string' }
        },
        relationships: {
          planet: { kind: 'hasOne', type: 'planet', inverse: 'moons' }
        }
      }
    }
  });
}
