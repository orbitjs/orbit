import { RecordSchema } from '@orbit/records';

export function createSchemaWithRemoteKey(): RecordSchema {
  return new RecordSchema({
    models: {
      star: {
        attributes: {
          name: { type: 'string' }
        },
        keys: {
          remoteId: {}
        },
        relationships: {
          celestialObjects: {
            kind: 'hasMany',
            type: ['planet', 'moon'],
            inverse: 'star'
          }
        }
      },
      planet: {
        attributes: {
          name: { type: 'string' },
          classification: { type: 'string' },
          atmosphere: { type: 'boolean' },
          sequence: { type: 'number' }
        },
        keys: {
          remoteId: {}
        },
        relationships: {
          moons: { kind: 'hasMany', type: 'moon', inverse: 'planet' },
          star: { kind: 'hasOne', type: 'star', inverse: 'celestialObjects' }
        }
      },
      moon: {
        attributes: {
          name: { type: 'string' }
        },
        keys: {
          remoteId: {}
        },
        relationships: {
          planet: { kind: 'hasOne', type: 'planet', inverse: 'moons' },
          star: { kind: 'hasOne', type: 'star', inverse: 'celestialObjects' }
        }
      },
      binaryStar: {
        attributes: {
          name: { type: 'string' }
        },
        relationships: {
          starOne: { kind: 'hasOne', type: 'star' }, // no inverse
          starTwo: { kind: 'hasOne', type: 'star' } // no inverse
        }
      },
      planetarySystem: {
        attributes: {
          name: { type: 'string' }
        },
        relationships: {
          star: { kind: 'hasOne', type: ['star', 'binaryStar'] } // no inverse
        }
      }
    }
  });
}
