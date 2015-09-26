import Orbit from 'orbit/main';
import Schema from 'orbit-common/schema';
import MemorySource from 'orbit-common/memory-source';
import Source from 'orbit-common/source';
import { all, Promise } from 'rsvp';
import { RecordNotFoundException, LinkNotFoundException } from 'orbit-common/lib/exceptions';
import { spread } from 'orbit/lib/functions';
import { uuid } from 'orbit/lib/uuid';
import { toIdentifier } from 'orbit-common/lib/identifiers';
import 'tests/test-helper';

var schema, source;

///////////////////////////////////////////////////////////////////////////////

module("OC - MemorySource", {
  setup: function() {
    Orbit.Promise = Promise;

    schema = new Schema({
      models: {
        planet: {
          attributes: {
            name: {type: 'string'},
            classification: {type: 'string'}
          },
          relationships: {
            moons: {type: 'hasMany', model: 'moon', inverse: 'planet'}
          }
        },
        moon: {
          attributes: {
            name: {type: 'string'}
          },
          relationships: {
            planet: {type: 'hasOne', model: 'planet', inverse: 'moons'}
          }
        }
      }
    });

    source = new MemorySource({schema: schema});
  },

  teardown: function() {
    schema = null;
    source = null;
    Orbit.Promise = null;
  }
});

test("it exists", function() {
  ok(source);
});

test("its prototype chain is correct", function() {
  ok(source instanceof Source, 'instanceof Source');
});

test("#find - can find a record by id", function() {
  expect(2);

  equal(source.length('planet'), 0, 'source should be empty');

  stop();
  source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant'}}).then(function(planet) {
    source.find('planet', planet.id).then(function(foundPlanet) {
      start();
      strictEqual(foundPlanet, planet, 'found planet matches original');
    });
  });
});

test("#find - returns RecordNotFoundException when a record can't be found by id", function() {
  expect(2);

  equal(source.length('planet'), 0, 'source should be empty');

  stop();
  source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant'}}).then(function(planet) {
    source.find('planet', 'bogus').then(function(foundPlanet) {
      ok(false, 'no planet should be found');
    }, function(e) {
      start();
      ok(e instanceof RecordNotFoundException, 'RecordNotFoundException thrown');
    });
  });
});

test("#find - can find all records", function() {
  expect(3);

  equal(source.length('planet'), 0, 'source should be empty');

  stop();
  all([
    source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant', atmosphere: true}}),
    source.addRecord({type: 'planet', attributes: {name: 'Earth', classification: 'terrestrial', atmosphere: true}}),
    source.addRecord({type: 'planet', attributes: {name: 'Mercury', classification: 'terrestrial', atmosphere: false}})
  ]).then(function() {
    equal(source.length('planet'), 3, 'source should contain 3 records');
    source.find('planet').then(function(allPlanets) {
      start();
      equal(allPlanets.length, 3, 'find() should return all records');
      return allPlanets;
    });
  });
});

test("#find - returns RecordNotFoundException when no records of a type have been added (using a default sparse cache)", function() {
  expect(2);

  equal(source.length('planet'), 0, 'source should be empty');

  stop();
  source.find('planet').then(function() {
    ok(false, 'no planet should be found');
  }, function(e) {
    start();
    ok(e instanceof RecordNotFoundException, 'RecordNotFoundException thrown');
  });
});

test("#find - returns an empty array of records when none have been added (using a non-sparse cache)", function() {
  expect(2);

  source = new MemorySource({schema: schema, cacheOptions: {sparse: false}});

  equal(source.length('planet'), 0, 'source should be empty');

  stop();
  source.find('planet').then(function(planets) {
    start();
    equal(planets.length, 0, 'an empty array of planets should be found');
  }, function(e) {
    ok(false, 'RecordNotFoundException should not be thrown');
  });
});

test("#query - can find records by one or more filters", function() {
  expect(5);

  equal(source.length('planet'), 0, 'source should be empty');

  stop();
  all([
    source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant', atmosphere: true}}),
    source.addRecord({type: 'planet', attributes: {name: 'Earth', classification: 'terrestrial', atmosphere: true}}),
    source.addRecord({type: 'planet', attributes: {name: 'Venus', classification: 'terrestrial', atmosphere: true}}),
    source.addRecord({type: 'planet', attributes: {name: 'Mercury', classification: 'terrestrial', atmosphere: false}})
  ]).then(function() {
    equal(source.length('planet'), 4, 'source should contain 4 records');

    source.query('planet', {attributes: {classification: 'terrestrial', atmosphere: true}}).then(function(allPlanets) {
      start();
      equal(allPlanets.length, 2, 'query() should return all matching records');
      equal(allPlanets[0].attributes.name, 'Earth', 'first matching planet');
      equal(allPlanets[1].attributes.name, 'Venus', 'second matching planet');
      return allPlanets;
    });
  });
});

test("#addRecord - creates a record", function() {
  expect(6);

  equal(source.length('planet'), 0, 'source should be empty');

  var original;

  stop();
  source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant'}}).then(function(planet) {
    original = planet;
    equal(source.length('planet'), 1, 'source should contain one record');
    ok(planet.id, 'id should be defined');
    equal(planet.attributes.name, 'Jupiter', 'name should match');
    equal(planet.attributes.classification, 'gas giant', 'classification should match');
    return planet;

  }).then(function(planet) {
    source.find('planet', planet.id).then(function(foundPlanet) {
      start();
      equal(foundPlanet.id, original.id, 'record can be looked up by id');
      return planet;
    });
  });
});

test("#addRecord - creates a record - data defaults to empty object", function() {
  expect(3);

  equal(source.length('planet'), 0, 'source should be empty');

  stop();
  source.addRecord({type: 'planet'}).then(function(planet) {
    start();
    equal(source.length('planet'), 1, 'source should contain one record');
    ok(planet.id, 'id should be defined');
    return planet;
  });
});

test("#addRecord / #removeRecord - can create and remove has-one links and their inverse links", function() {
  expect(10);

  equal(source.length('planet'), 0, 'source should be empty');

  var jupiter, earth,
      io;

  stop();
  source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant', atmosphere: true}})
    .then(function(planet) {
      jupiter = planet;
      return source.addRecord({type: 'moon', attributes: {name: 'Io'}, relationships: {planet: {data: toIdentifier('planet', jupiter.id)}}});
    })
    .then(function(moon) {
      io = moon;
      equal(Object.keys(jupiter.relationships.moons).length, 1, 'Jupiter has one moon after linking');
      ok(jupiter.relationships.moons.data[toIdentifier('moon', io.id)], 'Jupiter\'s moon is Io');
      equal(io.relationships.planet.data, toIdentifier('planet', jupiter.id), 'Io\'s planet is Jupiter');

      return source.addRecord({type: 'planet', attributes: { name: 'Earth' }});
    })
    .then(function(planet) {
      earth = planet;
      // Change the "inverse" link on the moon by linking it to our new planet
      return source.addToRelationship(earth, 'moons', io);
    })
    .then(function() {
      equal(Object.keys(earth.relationships.moons.data).length, 1, 'Earth has one moon after changing link');
      equal(Object.keys(jupiter.relationships.moons.data).length, 0, 'Jupiter has no moons after changing link');

      return source.removeRecord(earth);
    })
    .then(function() {
      strictEqual(io.relationships.planet.data, undefined, 'Removing earth set io\'s planet to undefined');
      return source.replaceRelationship(io, 'planet', jupiter);
    })
    .then(function() {
      equal(Object.keys(jupiter.relationships.moons.data).length, 1, 'Jupiter has one moon after linking');
      return source.removeRecord(io);
    })
    .then(function() {
      start();

      equal(source.length('moon'), 0, 'moon should be deleted');
      equal(Object.keys(jupiter.relationships.moons.data).length, 0, 'Jupiter has no moons');
    });
});

test("#addRecord / #removeRecord - can create and remove has-many links and their inverse links", function() {
  expect(6);

  equal(source.length('planet'), 0, 'source should be empty');

  var jupiter,
      io;

  stop();
  source.addRecord({type: 'moon', attributes: {name: 'Io'}})
    .then(function(moon) {
      io = moon;

      var moons = {};
      moons[toIdentifier('moon', io.id)] = true;

      return source.addRecord({type: 'planet', attributes: {name: 'Jupiter'}, relationships: {moons: {data: moons}}});
    })
    .then(function(planet) {
      jupiter = planet;
      equal(Object.keys(jupiter.relationships.moons.data).length, 1, 'Jupiter has one moon after linking');
      ok(jupiter.relationships.moons.data[toIdentifier('moon', io.id)], 'Jupiter\'s moon is Io');
      equal(io.relationships.planet.data, toIdentifier('planet', jupiter.id), 'Io\'s planet is Jupiter');

      return source.removeRecord(jupiter);
    })
    .then(function() {
      start();

      equal(source.length('planet'), 0, 'planet should be deleted');
      equal(io.relationships.planet.data, undefined, 'Io has no planet');
    });
});

test("#transform - remove operation for missing link path should leave a working source", function() {
  expect(3);
  equal(source.length('planet'), 0, 'source should be empty');
  equal(source.length('moon'), 0, 'source should be empty');

  stop();
  source.transform({
    op: 'remove',
    path: ['moon', 'not-there', 'relationships', 'planet', 'data']
  }).then(function() {
    ok(true, 'transforms continue on');
    start();
  });
});

test("#replaceRecord - can replace whole records", function() {
  expect(7);

  equal(source.length('planet'), 0, 'source should be empty');

  var original;

  stop();
  source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant'}})
    .then(function(planet) {
      original = planet;
      return source.replaceRecord({type: 'planet', id: planet.id, attributes: {name: 'Earth', classification: 'terrestrial'}});
    })
    .then(function() {
      var updatedPlanet = source.retrieve(['planet', original.id]);
      equal(updatedPlanet.id, original.id, 'id remains the same');
      equal(updatedPlanet.attributes.name, 'Earth', 'name has been updated');
      equal(updatedPlanet.attributes.classification, 'terrestrial', 'classification has been updated');

      return source.find('planet', original.id);
    })
    .then(function(foundPlanet) {
      start();
      equal(foundPlanet.id, original.id, 'record can be looked up by id');
      equal(foundPlanet.attributes.name, 'Earth', 'name has been updated');
      equal(foundPlanet.attributes.classification, 'terrestrial', 'classification has been updated');
    });
});

test("#replaceAttribute - can update attributes", function() {
  expect(5);

  equal(source.length('planet'), 0, 'source should be empty');

  var original;

  stop();
  source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant'}})
    .then(function(planet) {
      original = planet;
      return source.replaceAttribute(planet, 'name', 'Earth');
    })
    .then(function() {
      return source.find('planet', original.id);
    })
    .then(function(foundPlanet) {
      start();
      strictEqual(foundPlanet, original, 'still the same object as the one originally inserted');
      equal(foundPlanet.id, original.id, 'record can be looked up by id');
      equal(foundPlanet.attributes.name, 'Earth', 'name has been updated');
      equal(foundPlanet.attributes.classification, 'gas giant', 'classification has not been updated');
    });
});

test("#removeRecord - can delete records", function() {
  expect(3);

  equal(source.length('planet'), 0, 'source should be empty');

  stop();
  source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant'}})
    .then(function(planet) {
      equal(source.length('planet'), 1, 'source should contain one record');
      return source.removeRecord(planet);
    })
    .then(function() {
      start();
      equal(source.length('planet'), 0, 'source should be empty');
    });
});

test("#addToRelationship and #removeFromRelationship - can link and unlink records in a many-to-one relationship via the 'many' side", function() {
  expect(6);

  equal(source.length('planet'), 0, 'source should be empty');

  var jupiter,
      io;

  stop();
  source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant', atmosphere: true}})
    .then(function(planet) {
      jupiter = planet;
      return source.addRecord({type: 'moon', attributes: {name: 'Io'}});
    })
    .then(function(moon) {
      io = moon;
      return source.addToRelationship(jupiter, 'moons', io);
    })
    .then(function() {
      equal(Object.keys(jupiter.relationships.moons.data).length, 1, 'Jupiter has one moon after linking');
      equal(jupiter.relationships.moons.data[toIdentifier('moon', io.id)], true, 'Jupiter\'s moon is Io');
      equal(io.relationships.planet.data, toIdentifier('planet', jupiter.id), 'Io\'s planet is Jupiter');
      return source.removeFromRelationship(jupiter, 'moons', io);
    })
    .then(function() {
      start();
      equal(io.relationships.planet.data, undefined, 'Io is not associated with a planet after unlinking');
      equal(Object.keys(jupiter.relationships.moons.data).length, 0, 'Jupiter has no moons after unlinking');
    });
});

test("#addToRelationship and #removeFromRelationship - can link and unlink records in a many-to-one relationship via the 'one' side", function() {
  expect(6);

  equal(source.length('planet'), 0, 'source should be empty');

  var jupiter,
      io;

  stop();
  source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant', atmosphere: true}})
    .then(function(planet) {
      jupiter = planet;
      return source.addRecord({type: 'moon', attributes: {name: 'Io'}});
    })
    .then(function(moon) {
      io = moon;
      return source.addToRelationship(io, 'planet', jupiter);
    })
    .then(function() {
      equal(Object.keys(jupiter.relationships.moons.data).length, 1, 'Jupiter has one moon after linking');
      ok(jupiter.relationships.moons.data[toIdentifier('moon', io.id)], 'Jupiter\'s moon is Io');
      equal(io.relationships.planet.data, toIdentifier('planet', jupiter.id), 'Io\'s planet is Jupiter');
      return source.replaceRelationship(io, 'planet', undefined);
    })
    .then(function() {
      start();
      equal(io.relationships.planet.data, undefined, 'Io is not associated with a planet after unlinking');
      equal(Object.keys(jupiter.relationships.moons.data).length, 0, 'Jupiter has no moons after unlinking');
    });
});

test("#addToRelationship - replacing hasOne relationship removes record from previous hasMany relationship", function(){
  expect(2);
  stop();

  var jupiter, saturn, io;

  all([
    source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant', atmosphere: true}}),
    source.addRecord({type: 'planet', attributes: {name: 'Saturn', classification: 'gas giant', atmosphere: true}}),
    source.addRecord({type: 'moon', attributes: {name: 'Io'}})
  ])
    .then(spread(function(a, b, c) {
      jupiter = a;
      saturn = b;
      io = c;
      return source.replaceRelationship(io, 'planet', jupiter);
    }))
    .then(function() {
      return source.findRelationship(jupiter, 'moons');
    })
    .then(function(moons) {
      deepEqual(moons[0], {type: 'moon', id: io.id});
      return source.replaceRelationship(io, 'planet', saturn);
    })
    .then(function() {
      return source.findRelationship(jupiter, 'moons');
    })
    .then(function(moons) {
      start();
      equal(moons.length, 0);
    });
});

// TODO - evaluate necessity of `actsAsSet`
//
// test("#replaceRelationship - will fail when replacing records in a many-to-one relationship unless the linkDef is flagged as `actsAsSet`", function() {
//   expect(2);
//
//   equal(source.length('planet'), 0, 'source should be empty');
//
//   var jupiter,
//     io;
//
//   stop();
//   source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant', atmosphere: true}})
//     .then(function(planet) {
//       jupiter = planet;
//       return source.addRecord({type: 'moon', attributes: {name: 'Io'}});
//     })
//     .then(function(moon) {
//       io = moon;
//       return source.replaceRelationship(jupiter, 'moons', [ io ]);
//     })
//     .then(function() {
//       ok(false, 'should not be successful');
//     }, function(e) {
//       start();
//       equal(e.message, "Assertion failed: hasMany links can only be replaced when flagged as `actsAsSet`");
//     });
// });

test("#replaceRelationship - can link and unlink records in a many-to-one relationship via the 'many' side when it `actsAsSet`", function() {
  expect(6);

  equal(source.length('planet'), 0, 'source should be empty');

  var jupiter,
      io;

  // Moons link must be flagged with `actsAsSet`
  source.schema.models.planet.relationships.moons.actsAsSet = true;

  stop();
  source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant', atmosphere: true}})
    .then(function(planet) {
      jupiter = planet;
      return source.addRecord({type: 'moon', attributes: {name: 'Io'}});
    })
    .then(function(moon) {
      io = moon;
      return source.replaceRelationship(jupiter, 'moons', [ io ]);
    })
    .then(function() {
      equal(Object.keys(jupiter.relationships.moons.data).length, 1, 'Jupiter has one moon after linking');

      equal(jupiter.relationships.moons.data[toIdentifier('moon', io.id)], true, 'Jupiter\'s moon is Io');
      equal(io.relationships.planet.data, toIdentifier('planet', jupiter.id), 'Io\'s planet is Jupiter');

      return source.replaceRelationship(jupiter, 'moons', []);
    })
    .then(function() {
      start();
      equal(io.relationships.planet.data, undefined, 'Io is not associated with a planet after unlinking');
      equal(Object.keys(jupiter.relationships.moons.data).length, 0, 'Jupiter has no moons after unlinking');
    });
});

test("#replaceRelationship - can link and unlink records in a many-to-one relationship via the 'one' side", function() {
  expect(4);

  equal(source.length('planet'), 0, 'source should be empty');

  var jupiter,
      io;

  stop();
  source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant', atmosphere: true}})
    .then(function(planet) {
      jupiter = planet;
      return source.addRecord({type: 'moon', attributes: {name: 'Io'}});
    })
    .then(function(moon) {
      io = moon;
      return source.replaceRelationship(io, 'planet', jupiter);
    })
    .then(function() {
      start();
      equal(Object.keys(jupiter.relationships.moons.data).length, 1, 'Jupiter has one moon after linking');
      equal(jupiter.relationships.moons.data[toIdentifier('moon', io.id)], true, 'Jupiter\'s moon is Io');
      equal(io.relationships.planet.data, toIdentifier('planet', jupiter.id), 'Io\'s planet is Jupiter');
    });
});

test("#findRelationship - can find has-one linked ids", function() {
  expect(4);

  equal(source.length('planet'), 0, 'source should be empty');

  var jupiter,
      io;

  stop();
  source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant', atmosphere: true}})
    .then(function(planet) {
      jupiter = planet;
      return source.addRecord({type: 'moon', attributes: {name: 'Io'}});
    })
    .then(function(moon) {
      io = moon;
      return source.replaceRelationship(io, 'planet', jupiter);
    })
    .then(function() {
      equal(Object.keys(jupiter.relationships.moons.data).length, 1, 'Jupiter has one moon after linking');
      equal(io.relationships.planet.data, toIdentifier('planet', jupiter.id), 'Io\'s planet is Jupiter');
      return source.findRelationship(io, 'planet');
    })
    .then(function(planetId) {
      start();
      deepEqual(planetId, {type: 'planet', id: jupiter.id}, 'Io is linked to Jupiter');
    });
});

test("#findRelated - can find has-one linked records", function() {
  expect(4);

  equal(source.length('planet'), 0, 'source should be empty');

  var jupiter,
      io;

  stop();
  source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant', atmosphere: true}})
    .then(function(planet) {
      jupiter = planet;
      return source.addRecord({type: 'moon', attributes: {name: 'Io'}});
    })
    .then(function(moon) {
      io = moon;
      return source.replaceRelationship(io, 'planet', jupiter);
    })
    .then(function() {
      equal(Object.keys(jupiter.relationships.moons.data).length, 1, 'Jupiter has one moon after linking');
      equal(io.relationships.planet.data, toIdentifier('planet', jupiter.id), 'Io\'s planet is Jupiter');
      return source.findRelated(io, 'planet');
    })
    .then(function(planet) {
      start();
      equal(planet.id, jupiter.id, 'Io is linked to Jupiter');
    });
});

test("#findRelated - can find null for an empty has-one relationship", function() {
  expect(4);

  equal(source.length('planet'), 0, 'source should be empty');

  var jupiter,
      io;

  stop();
  source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant', atmosphere: true}})
    .then(function(planet) {
      jupiter = planet;
      return source.addRecord({type: 'moon', attributes: {name: 'Io'}});
    })
    .then(function(moon) {
      io = moon;

      equal(jupiter.relationships.moons.data, undefined, 'Jupiter has no moons');
      equal(io.relationships.planet.data, undefined, 'Io has no planet');

      return source.findRelated(io, 'planet');
    })
    .then(function(planet) {
      start();
      equal(planet, undefined, 'Io has no planet: findRelated returned undefined');
    });
});

test("#findRelationship - can find has-many linked values", function() {
  expect(5);

  equal(source.length('planet'), 0, 'source should be empty');

  var jupiter,
      io;

  stop();
  source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant', atmosphere: true}})
    .then(function(planet) {
      jupiter = planet;
      return source.addRecord({type: 'moon', attributes: {name: 'Io'}});
    })
    .then(function(moon) {
      io = moon;
      return source.addToRelationship(jupiter, 'moons', io);
    })
    .then(function() {
      equal(Object.keys(jupiter.relationships.moons.data).length, 1, 'Jupiter has one moon after linking');
      equal(io.relationships.planet.data, toIdentifier('planet', jupiter.id), 'Io\'s planet is Jupiter');

      return source.findRelationship(jupiter, 'moons');
    })
    .then(function(moonIds) {
      start();
      equal(moonIds.length, 1, 'Jupiter has one moon');
      equal(moonIds[0].id, io.id, '... and it\'s Io');
    });
});

test("#findRelated - can find has-many linked values", function() {
  expect(5);

  equal(source.length('planet'), 0, 'source should be empty');

  var jupiter,
      io;

  stop();
  source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant', atmosphere: true}})
    .then(function(planet) {
      jupiter = planet;
      return source.addRecord({type: 'moon', attributes: {name: 'Io'}});
    })
    .then(function(moon) {
      io = moon;
      return source.addToRelationship(jupiter, 'moons', io);
    })
    .then(function() {
      equal(Object.keys(jupiter.relationships.moons.data).length, 1, 'Jupiter has one moon after linking');
      equal(io.relationships.planet.data, toIdentifier('planet', jupiter.id), 'Io\'s planet is Jupiter');
      return source.findRelated(jupiter, 'moons');
    })
    .then(function(moons) {
      start();
      equal(moons.length, 1, 'Jupiter has one moon');
      equal(moons[0].attributes.name, 'Io', '... and Io is its name');
    });
});

test("#findRelated - can find an empty set of has-many linked values", function() {
  expect(4);

  equal(source.length('planet'), 0, 'source should be empty');

  var jupiter,
      io;

  stop();
  source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant', atmosphere: true}})
    .then(function(planet) {
      jupiter = planet;
      return source.addRecord({type: 'moon', attributes: {name: 'Io'}});
    })
    .then(function(moon) {
      io = moon;

      equal(jupiter.relationships.moons.data, undefined, 'Jupiter has no moons');
      equal(io.relationships.planet.data, undefined, 'Io has no planet');

      return source.findRelated(jupiter, 'moons');
    })
    .then(function(moons) {
      start();
      equal(moons, undefined, 'Jupiter has no moons: findRelated returned undefined');
    });
});

// TODO: consider re-adding link exceptions
//
// test("#findLink - returns LinkNotFoundException for a link that doesn't exist", function() {
//   expect(2);
//
//   equal(source.length('planet'), 0, 'source should be empty');
//
//   var jupiter,
//       io;
//
//   stop();
//   source.addRecord('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}).then(function(planet) {
//     jupiter = planet;
//
//     source.findLink('planet', jupiter, 'bogus').then(function(foundLink) {
//       ok(false, 'no link should be found');
//     }, function(e) {
//       start();
//       ok(e instanceof LinkNotFoundException, 'LinkNotFoundException thrown');
//     });
//   });
// });
//
// test("#findLink - returns RecordNotFoundException for a record that doesn't exist", function() {
//   expect(2);
//
//   equal(source.length('planet'), 0, 'source should be empty');
//
//   var jupiter,
//       io;
//
//   stop();
//   source.addRecord('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}).then(function(planet) {
//     jupiter = planet;
//
//     source.findLink('planet', 'bogus', 'moons').then(function(foundLink) {
//       ok(false, 'no link should be found');
//     }, function(e) {
//       start();
//       ok(e instanceof RecordNotFoundException, 'RecordNotFoundException thrown');
//     });
//   });
// });
