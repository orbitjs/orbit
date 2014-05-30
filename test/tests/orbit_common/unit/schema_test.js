import Schema from 'orbit_common/schema';

///////////////////////////////////////////////////////////////////////////////

module("OC - Schema", {
});

test("it exists", function() {
  var schema = new Schema();
  ok(schema);
});

test("it has an `idField` and `generateId` set by default", function() {
  var schema = new Schema();
  equal(schema.idField, '__id', 'idField has been set');
  ok(schema.generateId, 'generateId has been set');
});

test("`idField` and `generateId` can be overridden", function() {
  var customIdGenerator = function() {
    return Math.random().toString(); // don't do this ;)
  };

  var schema = new Schema({
    idField: 'id',
    generateId: customIdGenerator
  });

  equal(schema.idField, 'id', 'custom idField has been set');
  strictEqual(schema.generateId, customIdGenerator, 'custom generateId has been set');
});

test("#initRecord initializes a record with a unique idField", function() {
  var schema = new Schema({
    models: {
      planet: {}
    }
  });

  var earth = {},
      mars = {};

  schema.initRecord('planet', earth);
  schema.initRecord('planet', mars);

  ok(earth.__id, 'idField has been set');
  ok(mars.__id, 'idField has been set');
  notEqual(earth.__id, mars.__id, 'ids are unique');
});

test("#initRecord initializes a record's attributes with any defaults that are specified with a value or function", function() {
  var schema = new Schema({
    models: {
      planet: {
        attributes: {
          name: {type: 'string', defaultValue: 'Earth'},
          shape: {type: 'string'},
          classification: {type: 'string', defaultValue: function() {
            return 'terrestrial';
          }}
        }
      }
    }
  });

  var earth = {};
  schema.initRecord('planet', earth);

  strictEqual(earth.name, 'Earth', 'default has been set by value');
  strictEqual(earth.shape, null, 'default has not been set - should be null');
  strictEqual(earth.classification, 'terrestrial', 'default has been set by function');
});

test("#initRecord initializes a record's links", function() {
  var schema = new Schema({
    models: {
      planet: {
        links: {
          moons: {type: 'hasMany', model: 'moon', inverse: 'planet'}
        }
      },
      moon: {
        links: {
          planet: {type: 'hasOne', model: 'planet', inverse: 'moons'}
        }
      }
    }
  });

  var earth = {},
      moon = {};

  schema.initRecord('planet', earth);
  schema.initRecord('moon', moon);

  deepEqual(earth.links.moons, {}, 'hasMany relationship has been seeded with an empty object');
  strictEqual(moon.links.planet, null, 'default has not been set - should be null');
});

test("#initRecord will not overwrite data set as attributes", function() {
  var schema = new Schema({
    models: {
      planet: {
        attributes: {
          name: {type: 'string', defaultValue: 'Jupiter'},
          classification: {type: 'string', defaultValue: function() {
            return 'gas giant';
          }}
        },
        links: {
          moons: {type: 'hasMany', model: 'moon', inverse: 'planet'}
        }
      },
      moon: {
        attributes: {
          name: {type: 'string'}
        },
        links: {
          planet: {type: 'hasOne', model: 'planet', inverse: 'moons'}
        }
      }
    }
  });

  var earth,
      moon,
      jupiter,
      io,
      europa;

  earth = {name: 'Earth', classification: 'terrestrial'};
  schema.initRecord('planet', earth);

  moon = {name: '*The Moon*', links: {planet: earth[schema.idField]}};
  schema.initRecord('moon', moon);

  strictEqual(earth.name, 'Earth', 'name has been specified');
  strictEqual(earth.classification, 'terrestrial', 'classification has been specified');

  deepEqual(earth.links.moons, {}, 'hasMany relationship has been seeded with an empty object');
  strictEqual(moon.links.planet, earth[schema.idField], 'hasOne relationship was specified in data');

  io = {};
  schema.initRecord('moon', io);

  europa = {};
  schema.initRecord('moon', europa);

  var jupitersMoons = {};
  jupitersMoons[io[schema.idField]] = true;
  jupitersMoons[europa[schema.idField]] = true;

  jupiter = {name: 'Jupiter', links: {moons: jupitersMoons}};
  schema.initRecord('planet', jupiter);

  deepEqual(jupiter.links.moons, jupitersMoons, 'hasMany relationship was specified in data');
});