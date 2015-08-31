import Orbit from 'orbit/main';
import { uuid } from 'orbit/lib/uuid';
import Schema from 'orbit-common/schema';
import Serializer from 'orbit-common/serializer';
import JSONAPISerializer from 'orbit-common/jsonapi-serializer';
import { Promise } from 'rsvp';

var schema,
    serializer;

///////////////////////////////////////////////////////////////////////////////

module("OC - JSONAPISerializer", {
  setup: function() {
    Orbit.Promise = Promise;
  },

  teardown: function() {
    schema = null;
    serializer = null;
  }
});

function setupWithLocalIds() {
  schema = new Schema({
    modelDefaults: {
      keys: {
        '__id': {primaryKey: true, defaultValue: uuid},
        'id': {}
      }
    },
    models: {
      planet: {
        attributes: {
          name: {type: 'string'},
          classification: {type: 'string'}
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
  serializer = new JSONAPISerializer(schema);
}

function setupWithUUIDs() {
  schema = new Schema({
    models: {
      planet: {
        attributes: {
          name: {type: 'string'},
          classification: {type: 'string'}
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
  serializer = new JSONAPISerializer(schema);
}

test("it exists", function() {
  setupWithLocalIds();

  ok(serializer);
});

test("its prototype chain is correct", function() {
  setupWithLocalIds();

  ok(serializer instanceof Serializer, 'instanceof Serializer');
});

test("#resourceKey returns 'id' by default", function() {
  setupWithLocalIds();

  equal(serializer.resourceKey('planet'), 'id');
});

test("#resourceType returns the pluralized type by default", function() {
  setupWithLocalIds();

  equal(serializer.resourceType('planet'), 'planets');
});

test("#resourceLink returns the link by default", function() {
  setupWithLocalIds();

  equal(serializer.resourceLink('planet', 'moons'), 'moons');
});

test("#resourceAttr returns the attribute by default", function() {
  setupWithLocalIds();

  equal(serializer.resourceLink('planet', 'name'), 'name');
});

test("#typeFromResourceType returns the singularized type by default", function() {
  setupWithLocalIds();

  equal(serializer.typeFromResourceType('planets'), 'planet');
});

test("#attrFromResourceAttr returns the attribute by default", function() {
  setupWithLocalIds();

  equal(serializer.attrFromResourceAttr('planet', 'name'), 'name');
});

test("#linkFromResourceLink returns the link by default", function() {
  setupWithLocalIds();

  equal(serializer.linkFromResourceLink('planet', 'moons'), 'moons');
});

test("#resourceId returns a matching resource id given an orbit id (or array of ids) - using local IDs", function() {
  setupWithLocalIds();

  schema.normalize('planet', {'__id': '1', 'id': 'a'});
  schema.normalize('planet', {'__id': '2', 'id': 'b'});

  equal(serializer.resourceId('planet', '1'), 'a');
  equal(serializer.resourceId('planet', '2'), 'b');

  deepEqual(serializer.resourceId('planet', ['1', '2']), ['a', 'b'], "works for arrays too");
});

test("#resourceId returns a matching resource id given an orbit id (or array of ids) - using UUIDs", function() {
  setupWithUUIDs();

  schema.normalize('planet', {'id': 'a'});
  schema.normalize('planet', {'id': 'b'});

  equal(serializer.resourceId('planet', 'a'), 'a');
  equal(serializer.resourceId('planet', 'b'), 'b');

  deepEqual(serializer.resourceId('planet', ['a', 'b']), ['a', 'b'], "works for arrays too");
});

test("#idFromResourceId returns a matching orbit id given a resource id - using local IDs", function() {
  setupWithLocalIds();

  schema.normalize('planet', {'__id': '1', 'id': 'a'});
  schema.normalize('planet', {'__id': '2', 'id': 'b'});

  equal(serializer.idFromResourceId('planet', 'a'), '1');
  equal(serializer.idFromResourceId('planet', 'b'), '2');
});

test("#idFromResourceId returns a matching orbit id given a resource id - using UUIDs", function() {
  setupWithUUIDs();

  schema.normalize('planet', {'id': 'a'});
  schema.normalize('planet', {'id': 'b'});

  equal(serializer.idFromResourceId('planet', 'a'), 'a');
  equal(serializer.idFromResourceId('planet', 'b'), 'b');
});

test("#serialize - can serialize a simple resource with only type and id", function() {
  setupWithLocalIds();

  deepEqual(
    serializer.serialize(
      'planet',
      {
        id: '123',
      }
    ),
    {
      data: {
        type: 'planets',
        id: '123'
      }
    },
    'serialized document matches'
  );
});

test("#serialize - can serialize a simple resource with only attributes", function() {
  setupWithLocalIds();

  deepEqual(
    serializer.serialize(
      'planet',
      {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    ),
    {
      data: {
        type: 'planets',
        attributes: {
          name: 'Jupiter',
          classification: 'gas giant'
        }
      }
    },
    'serialized document matches'
  );
});

test("#serialize - can serialize a resource with attributes and has-many relationships", function() {
  setupWithLocalIds();

  schema.normalize('planet', {'__id': 'p1', 'id': 'p1-id'});
  schema.normalize('moon', {'__id': 'm1', 'id': 'm1-id'});
  schema.normalize('moon', {'__id': 'm2', 'id': 'm2-id'});

  deepEqual(
    serializer.serialize(
      'planet',
      {
        __id: 'p1',
        name: 'Jupiter',
        classification: 'gas giant',
        __rel: {
          moons: {
            'm1': true,
            'm2': true
          }
        }
      }
    ),
    {
      data: {
        type: 'planets',
        id: 'p1-id',
        attributes: {
          name: 'Jupiter',
          classification: 'gas giant'
        },
        relationships: {
          moons: {
            data: [
              { type: 'moons', id: 'm1-id' },
              { type: 'moons', id: 'm2-id' }
            ]
          }
        }
      }
    },
    'serialized document matches'
  );
});

test("#serialize - can serialize a resource with attributes and a null has-one relationship", function() {
  setupWithLocalIds();

  schema.normalize('planet', {'__id': 'p1', 'id': 'p1-id'});
  schema.normalize('moon', {'__id': 'm1', 'id': 'm1-id'});

  deepEqual(
    serializer.serialize(
      'moon',
      {
        __id: 'm1',
        name: 'Io',
        __rel: {
          planet: null
        }
      }
    ),
    {
      data: {
        type: 'moons',
        id: 'm1-id',
        attributes: {
          name: 'Io'
        },
        relationships: {
          planet: { data: null }
        }
      }
    },
    'deserialized document matches'
  );
});

test("#serialize - can serialize a resource with attributes and a has-one relationships", function() {
  setupWithLocalIds();

  schema.normalize('planet', {'__id': 'p1', 'id': 'p1-id'});
  schema.normalize('moon', {'__id': 'm1', 'id': 'm1-id'});

  deepEqual(
    serializer.serialize(
      'moon',
      {
        __id: 'm1',
        name: 'Io',
        __rel: {
          planet: 'p1'
        }
      }
    ),
    {
      data: {
        type: 'moons',
        id: 'm1-id',
        attributes: {
          name: 'Io'
        },
        relationships: {
          planet: {
            data: { type: 'planets', id: 'p1-id' }
          }
        }
      }
    },
    'deserialized document matches'
  );
});

test("#deserialize - can deserialize a simple resource with only type and id - using local IDs", function() {
  setupWithLocalIds();

  var result = serializer.deserialize(
    'planet',
    null,
    {
      data: {
        type: 'planets',
        id: '123'
      }
    }
  );
  var record = result.primary;

  deepEqual(
    record,
    {
      __id: record.__id,
      __normalized: true,
      __meta: {},
      id: '123',
      classification: null,
      name: null,
      __rel: {
        moons: {}
      }
    },
    'deserialized document matches'
  );
});

test("#deserialize - can deserialize a simple resource with only type and id - using UUIDs", function() {
  setupWithUUIDs();

  var result = serializer.deserialize(
    'planet',
    null,
    {
      data: {
        type: 'planets',
        id: '123'
      }
    }
  );
  var record = result.primary;

  deepEqual(
    record,
    {
      __normalized: true,
      __meta: {},
      id: '123',
      classification: null,
      name: null,
      __rel: {
        moons: {}
      }
    },
    'serialized document matches'
  );
});

test("#deserialize - can deserialize a compound document - using local IDs", function() {
  setupWithLocalIds();

  var result = serializer.deserialize(
    'planet',
    null,
    {
      data: {
        id: '12345',
        type: 'planets',
        attributes: {
          name: 'Jupiter',
          classification: 'gas giant'
        },
        relationships: {
          moons: {data: [{type: 'moons', id: '5'}]}
        }
      },
      included: [{
        id: '5',
        type: 'moons',
        attributes: {
          name: 'Io'
        },
        relationships: {
          planet: {data: {type: 'planets', id: '12345'}}
        }
      }]
    }
  );

  var planet = result.primary;
  var moon = result.included.moon[0];
  var planetsMoons = {};
  planetsMoons[moon.__id] = true;

  deepEqual(
    result,
    {
      primary: {
        __id: planet.__id,
        __normalized: true,
        __meta: {},
        id: '12345',
        classification: 'gas giant',
        name: 'Jupiter',
        __rel: {
          moons: planetsMoons
        }
      },
      included: {
        moon: [
          {
            __id: moon.__id,
            __normalized: true,
            __meta: {},
            id: "5",
            name: "Io",
            __rel: {
              planet: planet.__id
            }
          }
        ]
      },
    },
    'deserialized document matches'
  );
});

test("#deserialize - can deserialize a compound document - using UUIDs", function() {
  setupWithUUIDs();

  var result = serializer.deserialize(
    'planet',
    null,
    {
      data: {
        id: '12345',
        type: 'planets',
        attributes: {
          name: 'Jupiter',
          classification: 'gas giant'
        },
        relationships: {
          moons: {data: [{type: 'moons', id: '5'}]}
        }
      },
      included: [{
        id: '5',
        type: 'moons',
        attributes: {
          name: 'Io'
        },
        relationships: {
          planet: {data: {type: 'planets', id: '12345'}}
        }
      }]
    }
  );

  deepEqual(
    result,
    {
      primary: {
        __normalized: true,
        __meta: {},
        id: '12345',
        classification: 'gas giant',
        name: 'Jupiter',
        __rel: {
          moons: {
            "5": true
          }
        }
      },
      included: {
        moon: [
          {
            __normalized: true,
            __meta: {},
            id: "5",
            name: "Io",
            __rel: {
              planet: "12345"
            }
          }
        ]
      },
    },
    'deserialized document matches'
  );
});
