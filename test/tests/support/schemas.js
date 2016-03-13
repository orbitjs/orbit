import Schema from 'orbit-common/schema';
import { uuid } from 'orbit/lib/uuid';

var planetsSchema = new Schema({
  models: {
    planet: {
      keys: {
        id: { primaryKey: true, defaultValue: uuid },
        remoteId: { defaultValue: null }
      },
      attributes: {
        name: { type: 'string' },
        classification: { type: 'string' }
      },
      relationships: {
        moons: { type: 'hasMany', model: 'moon', inverse: 'planet' }
      }
    },
    moon: {
      attributes: {
        name: { type: 'string' }
      },
      relationships: {
        planet: { type: 'hasOne', model: 'planet', inverse: 'moons' }
      }
    }
  }
});

export { planetsSchema };
