import Schema from 'orbit-common/schema';

const planetsSchema = new Schema({
  models: {
    planet: {
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
