import 'tests/test-helper';
import Schema from 'orbit-common/schema';
import Serializer from 'orbit-common/serializer';
import JSONAPISerializer from 'orbit-common/jsonapi/serializer';
import Network from 'orbit-common/network';
import { toIdentifier } from 'orbit-common/lib/identifiers';
import { uuid } from 'orbit/lib/uuid';

var network, serializer;

///////////////////////////////////////////////////////////////////////////////

module('OC - JSONAPISerializer', {
  teardown: function() {
    network = null;
    serializer = null;
  }
});

var modelsInSchema = {
  planet: {
    attributes: {
      name: { type: 'string' },
      classification: { type: 'string' }
    },
    relationships: {
      moons: { type: 'hasMany', model: 'moon', inverse: 'planet' },
      solarSystem: { type: 'hasOne', model: 'solarSystem', inverse: 'planets' }
    }
  },
  moon: {
    attributes: {
      name: { type: 'string' }
    },
    relationships: {
      planet: { type: 'hasOne', model: 'planet', inverse: 'moons' }
    }
  },
  solarSystem: {
    attributes: {
      name: { type: 'string' }
    },
    relationships: {
      planets: { type: 'hasMany', model: 'planet', inverse: 'solarSystem' }
    }
  }
};

function setupWithLocalIds() {
  let schema = new Schema({
    modelDefaults: {
      id: {
        defaultValue: uuid
      },
      keys: {
        'remoteId': {}
      }
    },
    models: modelsInSchema
  });
  network = new Network(schema);
  serializer = new JSONAPISerializer(network);
  serializer.resourceKey = function() { return 'remoteId'; };
}

function setupWithUUIDs() {
  let schema = new Schema({ models: modelsInSchema });
  network = new Network(schema);
  serializer = new JSONAPISerializer(network);
}

test('it exists', function() {
  setupWithLocalIds();

  ok(serializer);
});

test('its prototype chain is correct', function() {
  setupWithLocalIds();

  ok(serializer instanceof Serializer, 'instanceof Serializer');
});

test('#resourceKey returns \'id\' by default', function() {
  setupWithUUIDs();

  equal(serializer.resourceKey('planet'), 'id');
});

test('#resourceType returns the pluralized, dasherized type by default', function() {
  setupWithLocalIds();

  equal(serializer.resourceType('planetaryObject'), 'planetary-objects');
});

test('#resourceRelationship returns the dasherized relationship by default', function() {
  setupWithLocalIds();

  equal(serializer.resourceRelationship('planet', 'surfaceElements'), 'surface-elements');
});

test('#resourceAttr returns the dasherized attribute by default', function() {
  setupWithLocalIds();

  equal(serializer.resourceRelationship('planet', 'fullName'), 'full-name');
});

test('#typeFromResourceType returns the singularized, camelized type by default', function() {
  setupWithLocalIds();

  equal(serializer.typeFromResourceType('planetary-objects'), 'planetaryObject');
});

test('#attrFromResourceAttr returns the camelized attribute by default', function() {
  setupWithLocalIds();

  equal(serializer.attrFromResourceAttr('planet', 'full-name'), 'fullName');
});

test('#relationshipFromResourceRelationship returns the camelized relationship by default', function() {
  setupWithLocalIds();

  equal(serializer.relationshipFromResourceRelationship('planet', 'surface-elements'), 'surfaceElements');
});

test('#resourceId returns a matching resource id given an orbit id (or array of ids) - using local IDs', function() {
  setupWithLocalIds();

  network.keyMap.push({ type: 'planet', id: '1', keys: { remoteId: 'a' } });
  network.keyMap.push({ type: 'planet', id: '2', keys: { remoteId: 'b' } });

  equal(serializer.resourceId('planet', '1'), 'a');
  equal(serializer.resourceId('planet', '2'), 'b');

  deepEqual(serializer.resourceId('planet', ['1', '2']), ['a', 'b'], 'works for arrays too');
});

test('#resourceId returns a matching resource id given an orbit id (or array of ids) - using UUIDs', function() {
  setupWithUUIDs();

  network.initializeRecord({ type: 'planet', id: 'a' });
  network.initializeRecord({ type: 'planet', id: 'b' });

  equal(serializer.resourceId('planet', 'a'), 'a');
  equal(serializer.resourceId('planet', 'b'), 'b');

  deepEqual(serializer.resourceId('planet', ['a', 'b']), ['a', 'b'], 'works for arrays too');
});

test('#idFromResourceId returns a matching orbit id given a resource id - using local IDs', function() {
  setupWithLocalIds();

  network.keyMap.push({ type: 'planet', id: '1', keys: { remoteId: 'a' } });
  network.keyMap.push({ type: 'planet', id: '2', keys: { remoteId: 'b' } });

  equal(serializer.idFromResourceId('planet', 'a'), '1');
  equal(serializer.idFromResourceId('planet', 'b'), '2');
});

test('#idFromResourceId returns a matching orbit id given a resource id - using UUIDs', function() {
  setupWithUUIDs();

  network.initializeRecord({ type: 'planet', id: 'a' });
  network.initializeRecord({ type: 'planet', id: 'b' });

  equal(serializer.idFromResourceId('planet', 'a'), 'a');
  equal(serializer.idFromResourceId('planet', 'b'), 'b');
});

test('#serialize - can serialize a simple resource with only type and id', function() {
  setupWithUUIDs();

  deepEqual(
    serializer.serialize(
      {
        type: 'planet',
        id: '123'
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

test('#serialize - can serialize a simple resource with only attributes', function() {
  setupWithLocalIds();

  deepEqual(
    serializer.serialize(
      {
        type: 'planet',
        attributes: {
          name: 'Jupiter',
          classification: 'gas giant'
        }
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

test('#serialize - can serialize a resource with attributes and has-many relationships', function() {
  setupWithLocalIds();

  network.keyMap.push({ type: 'planet', id: 'p1', keys: { remoteId: 'p1-id' } });
  network.keyMap.push({ type: 'moon', id: 'm1', keys: { remoteId: 'm1-id' } });
  network.keyMap.push({ type: 'moon', id: 'm2', keys: { remoteId: 'm2-id' } });

  deepEqual(
    serializer.serialize(
      {
        type: 'planet',
        id: 'p1',
        attributes: {
          name: 'Jupiter',
          classification: 'gas giant'
        },
        relationships: {
          moons: {
            data: {
              'moon:m1': true,
              'moon:m2': true
            }
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

test('#serialize - can serialize a resource with attributes and a null has-one relationship', function() {
  setupWithLocalIds();

  network.keyMap.push({ type: 'planet', id: 'p0', keys: { remoteId: 'p1-id' } });
  network.keyMap.push({ type: 'moon', id: 'm1', keys: { remoteId: 'm1-id' } });

  deepEqual(
    serializer.serialize(
      {
        type: 'moon',
        id: 'm1',
        attributes: {
          name: 'Io'
        },
        relationships: {
          planet: {
            data: null
          }
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

test('#serialize - can serialize a resource with attributes and a has-one relationships', function() {
  setupWithLocalIds();

  network.keyMap.push({ type: 'planet', id: 'p1', keys: { remoteId: 'p1-id' } });
  network.keyMap.push({ type: 'solarSystem', id: 'ss1', keys: { remoteId: 'ss1-id' } });

  deepEqual(
    serializer.serialize(
      {
        type: 'planet',
        id: 'p1',
        attributes: {
          name: 'Jupiter'
        },
        relationships: {
          solarSystem: {
            data: 'solarSystem:ss1'
          }
        }
      }
    ),
    {
      data: {
        type: 'planets',
        id: 'p1-id',
        attributes: {
          name: 'Jupiter'
        },
        relationships: {
          'solar-system': {
            data: { type: 'solar-systems', id: 'ss1-id' }
          }
        }
      }
    },
    'deserialized document matches'
  );
});

test('#deserialize - can deserialize a simple resource with only type and id - using local IDs', function() {
  setupWithLocalIds();

  var result = serializer.deserialize(
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
      id: undefined,
      type: 'planet',
      keys: {
        remoteId: '123'
      },
      attributes: {
        classification: undefined,
        name: undefined
      },
      relationships: {
        moons: {
          data: {}
        },
        solarSystem: {
          data: null
        }
      }
    },
    'deserialized document matches'
  );
});

test('#deserialize - can deserialize a simple resource with only type and id - using UUIDs', function() {
  setupWithUUIDs();

  var result = serializer.deserialize(
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
      type: 'planet',
      id: '123',
      attributes: {
        classification: undefined,
        name: undefined
      },
      relationships: {
        moons: {
          data: {}
        },
        solarSystem: {
          data: null
        }
      }
    },
    'serialized document matches'
  );
});

test('#deserialize - can deserialize a compound document - using local IDs', function() {
  setupWithLocalIds();

  var result = serializer.deserialize(
    {
      data: {
        id: '12345',
        type: 'planets',
        attributes: {
          name: 'Jupiter',
          classification: 'gas giant'
        },
        relationships: {
          moons: { data: [{ type: 'moons', id: '5' }] },
          'solar-system': { data: { type: 'solar-systems', id: '6' } }
        }
      },
      included: [{
        id: '5',
        type: 'moons',
        attributes: {
          name: 'Io'
        },
        relationships: {
          planet: { data: { type: 'planets', id: '12345' } }
        }
      }, {
        id: '6',
        type: 'solar-systems',
        attributes: {
          name: 'The Solar System'
        },
        relationships: {
          planets: { data: [{ type: 'planets', id: '12345' }] }
        }
      }]
    }
  );

  var planet = result.primary;
  var moon = result.included[0];
  var solarSystem = result.included[1];
  var planetsMoons = {};
  planetsMoons[toIdentifier('moon', moon.id)] = true;
  var ssPlanets = {};
  ssPlanets[toIdentifier('planet', planet.id)] = true;

  deepEqual(
    result,
    {
      primary: {
        __normalized: true,
        type: 'planet',
        id: planet.id,
        keys: {
          remoteId: '12345'
        },
        attributes: {
          classification: 'gas giant',
          name: 'Jupiter'
        },
        relationships: {
          moons: {
            data: planetsMoons
          },
          solarSystem: {
            data: toIdentifier('solarSystem', solarSystem.id)
          }
        }
      },
      included: [
        {
          __normalized: true,
          type: 'moon',
          id: moon.id,
          keys: {
            remoteId: '5'
          },
          attributes: {
            name: 'Io'
          },
          relationships: {
            planet: {
              data: toIdentifier('planet', planet.id)
            }
          }
        },
        {
          __normalized: true,
          type: 'solarSystem',
          id: solarSystem.id,
          keys: {
            remoteId: '6'
          },
          attributes: {
            name: 'The Solar System'
          },
          relationships: {
            planets: {
              data: ssPlanets
            }
          }
        }
      ]
    },
    'deserialized document matches'
  );
});

test('#deserialize - can deserialize a compound document - using UUIDs', function() {
  setupWithUUIDs();

  var result = serializer.deserialize(
    {
      data: {
        id: '12345',
        type: 'planets',
        attributes: {
          name: 'Jupiter',
          classification: 'gas giant'
        },
        relationships: {
          moons: { data: [{ type: 'moons', id: '5' }] }
        }
      },
      included: [{
        id: '5',
        type: 'moons',
        attributes: {
          name: 'Io'
        },
        relationships: {
          planet: { data: { type: 'planets', id: '12345' } }
        }
      }]
    }
  );

  deepEqual(
    result,
    {
      primary: {
        __normalized: true,
        type: 'planet',
        id: '12345',
        attributes: {
          classification: 'gas giant',
          name: 'Jupiter'
        },
        relationships: {
          moons: {
            data: {
              'moon:5': true
            }
          },
          solarSystem: {
            data: null
          }
        }
      },
      included: [
        {
          __normalized: true,
          type: 'moon',
          id: '5',
          attributes: {
            name: 'Io'
          },
          relationships: {
            planet: {
              data: 'planet:12345'
            }
          }
        }
      ]
    },
    'deserialized document matches'
  );
});
