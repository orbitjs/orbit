import Orbit from 'orbit/main';
import Schema from 'orbit-common/schema';
import { Promise } from 'rsvp';
import { uuid } from 'orbit/lib/uuid';
import { ModelNotRegisteredException } from 'orbit-common/lib/exceptions';

///////////////////////////////////////////////////////////////////////////////

module("OC - Schema", {
  setup: function() {
    Orbit.Promise = Promise;
  }
});

test("it exists", function() {
  var schema = new Schema();
  ok(schema);
});

test("it has a `modelDefaults` set by default", function() {
  var schema = new Schema({
    models: {
      planet: {}
    }
  });

  ok(schema.modelDefaults, 'modelDefaults has been set');
  ok(schema.modelDefaults.keys, 'modelDefaults.keys has been set');
  equal(Object.keys(schema.modelDefaults.keys).length, 1, 'modelDefaults.keys has one member');
  ok(schema.modelDefaults.keys['id'], 'modelDefaults.keys[\'id\'] has been set');
  equal(schema.modelDefaults.keys['id'].primaryKey, true, 'modelDefaults.keys[\'id\'].primaryKey is has been set');
  strictEqual(schema.modelDefaults.keys['id'].defaultValue, uuid, 'modelDefaults.keys[\'id\'].defaultValue has been set');

  var model;
  ok(schema.models, 'schema.models has been set');
  ok((model = schema.models['planet']), 'model definition has been set');
  ok(model.keys, 'model.keys has been set');
  ok(model.keys['id'], 'model.keys[\'id\'] has been set');
  ok(model.primaryKey, 'model.primaryKey has been set');
  strictEqual(model.primaryKey, model.keys['id'], 'model.primaryKey matches definition in `keys`');
  equal(model.primaryKey.name, 'id', 'model.primaryKey.name has been set');
  equal(model.primaryKey.type, 'string', 'model.primaryKey.type is `string`');
  equal(model.primaryKey.primaryKey, true, 'model.primaryKey.primaryKey is true');
  strictEqual(model.primaryKey.defaultValue, uuid, 'model.primaryKey.defaultValue has been set');
});

test("`modelDefaults can be overridden", function() {
  var customIdGenerator = function() {
    return Math.random().toString(); // don't do this ;)
  };

  var schema = new Schema({
    modelDefaults: {
      keys: {
        clientId: {
          primaryKey: true,
          defaultValue: customIdGenerator
        },
        remoteId: {}
      },
      attributes: {
        someAttr: {}
      },
      links: {
        someLink: {}
      }
    },
    models: {
      planet: {},
      moon: {
        keys: {
          remoteId: undefined
        },
        attributes: {
          someAttr: undefined
        },
        links: {
          someLink: undefined
        }
      }
    }
  });

  ok(schema.modelDefaults, 'modelDefaults has been set');
  ok(schema.modelDefaults.keys, 'modelDefaults.keys has been set');
  equal(schema.modelDefaults.keys.hasOwnProperty('id'), false, '\'id\' attribute not present');
  ok(schema.modelDefaults.keys['clientId'], 'custom id attribute has been set');
  equal(schema.modelDefaults.keys['clientId'].primaryKey, true, 'custom id is primaryKey');
  strictEqual(schema.modelDefaults.keys['clientId'].defaultValue, customIdGenerator, 'custom id generator has been set');
  ok(schema.modelDefaults.keys['remoteId'], 'custom remoteId key has been set');
  ok(schema.modelDefaults.attributes, 'modelDefaults.attributes has been set');
  ok(schema.modelDefaults.attributes['someAttr'], 'default model schema attribute has been set');
  ok(schema.modelDefaults.links['someLink'], 'default model link schema has been set');

  var model;
  ok(schema.models, 'schema.models has been set');
  ok((model = schema.models['planet']), 'model definition has been set');
  ok(model.keys, 'model.keys has been set');
  ok(model.attributes, 'model.attributes has been set');
  ok(model.links, 'model.links has been set');
  ok(model.keys['clientId'], 'model.keys[\'clientId\'] has been set');
  strictEqual(model.primaryKey, model.keys['clientId'], 'model.primaryKey is consistent');
  equal(model.primaryKey.name, 'clientId', 'model.primaryKey.name has been set');
  equal(model.primaryKey.type, 'string', 'model.primaryKey.type has been set');
  equal(model.primaryKey.primaryKey, true, 'model.primaryKey.primaryKey has been set');
  strictEqual(model.primaryKey.defaultValue, customIdGenerator, 'model.primaryKey.defaultValue has been set');
  ok(model.attributes['someAttr'], 'model.attributes match defaults');
  ok(model.links['someLink'], 'model.links match defaults');

  ok((model = schema.models['moon']), 'model definition has been set');
  ok(model.keys, 'model.keys has been set');
  ok(model.attributes, 'model.attributes has been set');
  ok(model.links, 'model.links has been set');
  ok(model.keys['clientId'], 'model.keys[\'clientId\'] has been set');
  strictEqual(model.primaryKey, model.keys['clientId'], 'model.primaryKey is consistent');
  equal(model.secondaryKeys, undefined, 'model has no secondaryKeys');
  equal(Object.keys(model.keys).length, 1, 'model has one key');
  equal(Object.keys(model.attributes).length, 0, 'model has no attributes');
  equal(Object.keys(model.links).length, 0, 'model has no links');
});

test("#registerModel can register models after initialization", function() {
  var customIdGenerator = function() {
    return Math.random().toString(); // don't do this ;)
  };

  var schema = new Schema({
    modelDefaults: {
      keys: {
        clientId: {
          primaryKey: true,
          defaultValue: customIdGenerator
        },
        remoteId: {}
      },
      attributes: {
        someAttr: {}
      },
      links: {
        someLink: {}
      }
    },
    models: {
      planet: {}
    }
  });

  ok(schema.models, 'schema.models has been set');
  ok(schema.models['planet'], 'model definition has been set');
  equal(schema.models['moon'], undefined, 'moon\'s definition has NOT been set');

  schema.on('modelRegistered', function(name) {
    if (name = 'moon') {
      start();

      var model;
      ok(model = schema.models['moon'], 'model definition has been set');
      ok(model.keys, 'model.keys has been set');
      ok(model.attributes, 'model.attributes has been set');
      ok(model.links, 'model.links has been set');
      ok(model.keys['clientId'], 'model.keys[\'clientId\'] has been set');
      strictEqual(model.primaryKey, model.keys['clientId'], 'model.primaryKey is consistent');
      equal(model.secondaryKeys, undefined, 'model has no secondaryKeys');
      equal(Object.keys(model.keys).length, 1, 'model has one key');
      equal(Object.keys(model.attributes).length, 0, 'model has no attributes');
      equal(Object.keys(model.links).length, 0, 'model has no links');
    }
  });

  stop();
  schema.registerModel('moon', {
    keys: {
      remoteId: undefined
    },
    attributes: {
      someAttr: undefined
    },
    links: {
      someLink: undefined
    }
  });
});

test("#normalize initializes a record with a unique primary key", function() {
  var schema = new Schema({
    models: {
      planet: {}
    }
  });

  var earth = schema.normalize('planet', {});
  var mars = schema.normalize('planet', {});

  ok(earth.id, 'id has been set');
  ok(mars.id, 'id has been set');
  notEqual(earth.id, mars.id, 'ids are unique');
});

test("#normalize throws a ModelNotRegisteredException error for missing models", function() {
  var schema = new Schema({
    models: {
      planet: {}
    }
  });

  expect(1);

  throws(function() {
    var earth = schema.normalize('not-planet', {});
  }, ModelNotRegisteredException, 'threw a OC.ModelNotRegisteredException');
});

test("#normalize - local and remote ids can be mapped", function() {
  var schema = new Schema({
    modelDefaults: {
      keys: {
        '__id': {
          primaryKey: true,
          defaultValue: uuid
        },
        'id': {}
      }
    },
    models: {
      planet: {},
      moon: {}
    }
  });

  schema.normalize('planet', {'__id': '1', 'id': 'a'});
  schema.normalize('planet', {'__id': '2', 'id': 'b'});
  schema.normalize('moon', {'__id': '1', 'id': 'c'});
  schema.normalize('moon', {'__id': '2', 'id': 'a'});

  equal(schema.secondaryToPrimaryKey('moon', 'id', 'c'), '1');
  equal(schema.secondaryToPrimaryKey('planet', 'id', 'a'), '1');
  equal(schema.secondaryToPrimaryKey('planet', 'id', 'bogus'), undefined);
  ok(schema.secondaryToPrimaryKey('planet', 'id', 'bogus', true), 'keys with a `defaultValue` can be autogenerated');

  equal(schema.primaryToSecondaryKey('planet', 'id', '2'), 'b');
  equal(schema.primaryToSecondaryKey('moon', 'id', '2'), 'a');
  equal(schema.primaryToSecondaryKey('planet', 'id', 'bogus'), undefined);
  equal(schema.primaryToSecondaryKey('planet', 'id', 'bogus', true), undefined, 'keys without a `defaultValue` can not be autogenerated');
});

test("#normalize initializes a record's attributes with any defaults that are specified with a value or function", function() {
  var schema = new Schema({
    models: {
      planet: {
        attributes: {
          name: {type: 'string', defaultValue: 'Earth'},
          shape: {type: 'string'},
          classification: {type: 'string', defaultValue: function() {
            return 'terrestrial';
          }},
          hasWater: {type: 'boolean', defaultValue: false}
        }
      }
    }
  });

  var earth = schema.normalize('planet', {});

  strictEqual(earth.name, 'Earth', 'default has been set by value');
  strictEqual(earth.shape, null, 'default has not been set - should be null');
  strictEqual(earth.classification, 'terrestrial', 'default has been set by function');
  strictEqual(earth.hasWater, false, 'default has not been set - should be false');
});

test("#normalize initializes a record's links", function() {
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

  var earth = schema.normalize('planet', {});
  var moon = schema.normalize('moon', {});

  deepEqual(earth.__rel.moons, {}, 'hasMany relationship has been seeded with an empty object');
  strictEqual(moon.__rel.planet, null, 'default has not been set - should be null');
});

test("#normalize will not overwrite data set as attributes", function() {
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

  var earth = schema.normalize('planet', {name: 'Earth', classification: 'terrestrial'});

  var moon = schema.normalize('moon', {name: '*The Moon*', __rel: {planet: earth.id}});

  strictEqual(earth.name, 'Earth', 'name has been specified');
  strictEqual(earth.classification, 'terrestrial', 'classification has been specified');

  deepEqual(earth.__rel.moons, {}, 'hasMany relationship has been seeded with an empty object');
  strictEqual(moon.__rel.planet, earth.id, 'hasOne relationship was specified in data');

  var io = schema.normalize('moon', {});

  var europa = schema.normalize('moon', {});

  var jupitersMoons = {};
  jupitersMoons[io.id] = true;
  jupitersMoons[europa.id] = true;

  var jupiter = schema.normalize('planet', {name: 'Jupiter', __rel: {moons: jupitersMoons}});

  deepEqual(jupiter.__rel.moons, jupitersMoons, 'hasMany relationship was specified in data');
});

test("#registerAllKeys - local and remote ids can be mapped from a data document matching this schema", function() {
  var schema = new Schema({
    modelDefaults: {
      keys: {
        '__id': {
          primaryKey: true,
          defaultValue: uuid
        },
        'id': {}
      }
    },
    models: {
      planet: {},
      moon: {}
    }
  });

  schema.registerAllKeys({
    planet: {
      '1': {'__id': '1', 'id': 'a'},
      '2': {'__id': '2', 'id': 'b'}
    },
    moon: {
      '1': {'__id': '1', 'id': 'c'},
      '2': {'__id': '2', 'id': 'a'}
    }
  });

  equal(schema.secondaryToPrimaryKey('moon', 'id', 'c'), '1');
  equal(schema.secondaryToPrimaryKey('planet', 'id', 'a'), '1');
  equal(schema.secondaryToPrimaryKey('planet', 'id', 'bogus'), undefined);
  ok(schema.secondaryToPrimaryKey('planet', 'id', 'bogus', true), 'keys with a `defaultValue` can be autogenerated');

  equal(schema.primaryToSecondaryKey('planet', 'id', '2'), 'b');
  equal(schema.primaryToSecondaryKey('moon', 'id', '2'), 'a');
  equal(schema.primaryToSecondaryKey('planet', 'id', 'bogus'), undefined);
  equal(schema.primaryToSecondaryKey('planet', 'id', 'bogus', true), undefined, 'keys without a `defaultValue` can not be autogenerated');
});

test("#pluralize simply adds an `s` to the end of words", function() {
  var schema = new Schema();
  equal(schema.pluralize('cow'), 'cows', "no kine here");
});

test("#singularize simply removes a trailing `s` if present at the end of words", function() {
  var schema = new Schema();
  equal(schema.singularize('cows'), 'cow', "no kine here");
  equal(schema.singularize('data'), 'data', "no Latin knowledge here");
});
