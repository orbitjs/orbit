import Schema from 'orbit-common/schema';

var planetsSchema = new Schema({
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
