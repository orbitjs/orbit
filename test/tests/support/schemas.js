import Schema from 'orbit-common/schema';
import { uuid } from 'orbit/lib/uuid';

var planetsSchema = new Schema({
  models: {
    planet: {
      keys: {
        id: { primaryKey: true, defaultValue: uuid }
      },
      relationships: {
        moons: { type: 'hasMany', model: 'moon' }
      }
    },
    moon: {
      relationships: {
        planet: { type: 'hasOne', model: 'planet' }
      }
    }
  }
});

export { planetsSchema };
