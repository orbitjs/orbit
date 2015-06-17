import Orbit from 'orbit/main';
import Schema from 'orbit-common/schema';
import MemorySource from 'orbit-common/memory-source';
import Source from 'orbit-common/source';
import { all, Promise } from 'rsvp';
import { RecordNotFoundException, LinkNotFoundException } from 'orbit-common/lib/exceptions';
import { spread } from 'orbit/lib/functions';
import 'tests/test-helper';

var source;

///////////////////////////////////////////////////////////////////////////////

module("OC - MemorySource", {
  setup: function() {
    Orbit.Promise = Promise;

    var schema = new Schema({
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

    source = new MemorySource(schema);
  },

  teardown: function() {
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

// TODO - fixup transform tests
//
//test("#transform - can insert records and assign ids", function() {
//  expect(6);
//
//  equal(source.length('planet'), 0, 'source should be empty');
//
//  stop();
//  source.transform('add', 'planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
//    equal(source.length('planet'), 1, 'source should contain one record');
//    ok(planet.id, 'id should be defined');
//    equal(planet.name, 'Jupiter', 'name should match');
//    equal(planet.classification, 'gas giant', 'classification should match');
//    return planet;
//
//  }).then(function(planet) {
//    source.findRecord('planet', planet.id).then(function(foundPlanet) {
//      start();
//      equal(foundPlanet.id, planet.id, 'record can be looked up by id');
//      return planet;
//    });
//  });
//});
//
//test("#transform - throws an error when a record with a duplicate id is inserted", function() {
//  expect(4);
//
//  equal(source.length('planet'), 0, 'source should be empty');
//
//  stop();
//  source.transform('add', 'planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
//    equal(source.length('planet'), 1, 'source should contain one record');
//    ok(planet.id, 'id should be defined');
//    return planet;
//
//  }).then(function(planet) {
//    source.transform('add', 'planet', {id: planet.id, name: 'Jupiter', classification: 'gas giant'}).then(null, function(e) {
//      start();
//      equal(e.constructor, 'AlreadyExistsException', 'duplicate error');
//    });
//  });
//});
//
//test("#transform - can update records", function() {
//  expect(8);
//
//  equal(source.length('planet'), 0, 'source should be empty');
//
//  var original;
//
//  stop();
//  source.transform('add', 'planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
//    original = planet;
//    return source.transform('replace', 'planet', {id: planet.id, name: 'Earth', classification: 'terrestrial'}).then(function(updatedPlanet) {
//      equal(updatedPlanet.id, planet.id, 'id remains the same');
//      equal(updatedPlanet.name, 'Earth', 'name has been updated');
//      equal(updatedPlanet.classification, 'terrestrial', 'classification has been updated');
//      return planet;
//    });
//
//  }).then(function(planet) {
//    source.findRecord('planet', planet.id).then(function(foundPlanet) {
//      start();
//      strictEqual(foundPlanet, original, 'still the same object as the one originally inserted');
//      equal(foundPlanet.id, planet.id, 'record can be looked up by id');
//      equal(foundPlanet.name, 'Earth', 'name has been updated');
//      equal(foundPlanet.classification, 'terrestrial', 'classification has been updated');
//      return planet;
//    });
//  });
//});
//
//test("#transform - can patch records", function() {
//  expect(8);
//
//  equal(source.length('planet'), 0, 'source should be empty');
//
//  var original;
//
//  stop();
//  source.transform('add', 'planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
//    original = planet;
//    return planet;
//
//  }).then(function(planet) {
//    return source.transform('patch', 'planet', {id: planet.id, name: 'Earth'}).then(function(updatedPlanet) {
//      equal(updatedPlanet.id, planet.id, 'id remains the same');
//      equal(updatedPlanet.name, 'Earth', 'name has been updated');
//      equal(updatedPlanet.classification, 'gas giant', 'classification has not been updated');
//      return planet;
//    });
//
//  }).then(function(planet) {
//    source.findRecord('planet', planet.id).then(function(foundPlanet) {
//      start();
//      strictEqual(foundPlanet, original, 'still the same object as the one originally inserted');
//      equal(foundPlanet.id, planet.id, 'record can be looked up by id');
//      equal(foundPlanet.name, 'Earth', 'name has been updated');
//      equal(foundPlanet.classification, 'gas giant', 'classification has not been updated');
//      return planet;
//    });
//  });
//});
//
//test("#transform - can delete records", function() {
//  expect(3);
//
//  equal(source.length('planet'), 0, 'source should be empty');
//
//  stop();
//  source.transform('add', 'planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
//    equal(source.length('planet'), 1, 'source should contain one record');
//
//    source.transform('remove', 'planet', {id: planet.id}).then(function() {
//      start();
//      equal(source.length('planet'), 0, 'source should be empty');
//    });
//  });
//});

test("#find - can find a record by id", function() {
  expect(2);

  equal(source.length('planet'), 0, 'source should be empty');

  stop();
  source.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
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
  source.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    source.find('planet', 'bogus').then(function(foundPlanet) {
      ok(false, 'no planet should be found');
    }, function(e) {
      start();
      ok(e instanceof RecordNotFoundException, 'RecordNotFoundException thrown');
    });
  });
});

test("#find - can find a record by object that contains an id", function() {
  expect(2);

  equal(source.length('planet'), 0, 'source should be empty');

  stop();
  source.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    source.find('planet', planet).then(function(foundPlanet) {
      start();
      strictEqual(foundPlanet, planet, 'found planet matches original');
    });
  });
});

test("#find - returns RecordNotFoundException when a record can't be found by remote id", function() {
  expect(2);

  equal(source.length('planet'), 0, 'source should be empty');

  stop();
  source.add('planet', {id: '1', name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    source.find('planet', {id: 'bogus'}).then(function(foundPlanet) {
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
    source.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}),
    source.add('planet', {name: 'Earth', classification: 'terrestrial', atmosphere: true}),
    source.add('planet', {name: 'Mercury', classification: 'terrestrial', atmosphere: false})
  ]).then(function() {
    equal(source.length('planet'), 3, 'source should contain 3 records');
    source.find('planet').then(function(allPlanets) {
      start();
      equal(allPlanets.length, 3, 'find() should return all records');
      return allPlanets;
    });
  });
});

test("#find - can find an array of records by id", function() {
  expect(4);

  equal(source.length('planet'), 0, 'source should be empty');

  var ids = [];

  stop();

  source.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    ids.push(planet.id);
    return source.add('planet', {name: 'Earth', classification: 'terrestrial'});

  }).then(function(planet) {
    ids.push(planet.id);
    return source.add('planet', {name: 'Mercury', classification: 'terrestrial'});

  }).then(function(planet) {
    return source.find('planet', ids);

  }).then(function(planets) {
    start();
    equal(planets.length, 2, 'find() should return the request\'s records');
    equal(planets[0].id, ids[0], 'planet id matches');
    equal(planets[1].id, ids[1], 'planet id matches');
  });
});

test("#find - returns RecordNotFoundException when any record in an array can't be found", function() {
  expect(3);

  equal(source.length('planet'), 0, 'source should be empty');

  var ids = [];

  stop();

  source.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    ids.push(planet.id);
    return source.add('planet', {name: 'Earth', classification: 'terrestrial'});

  }).then(function(planet) {
    ids.push(planet.id);
    return source.add('planet', {name: 'Mercury', classification: 'terrestrial'});

  }).then(function(planet) {
    ids.push('fake');
    ids.push('bogus');
    return source.find('planet', ids);

  }).then(function(planets) {
    ok(false, 'no planet should be found');

  }, function(e) {
    start();
    ok(e instanceof RecordNotFoundException, 'RecordNotFoundException thrown');
    deepEqual(e.record, ['fake', 'bogus'], 'ids that could not be found should be returned');
  });
});

test("#find - can find records by one or more filters", function() {
  expect(5);

  equal(source.length('planet'), 0, 'source should be empty');

  stop();
  all([
    source.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}),
    source.add('planet', {name: 'Earth', classification: 'terrestrial', atmosphere: true}),
    source.add('planet', {name: 'Venus', classification: 'terrestrial', atmosphere: true}),
    source.add('planet', {name: 'Mercury', classification: 'terrestrial', atmosphere: false})
  ]).then(function() {
    equal(source.length('planet'), 4, 'source should contain 4 records');

    source.find('planet', {classification: 'terrestrial', atmosphere: true}).then(function(allPlanets) {
      start();
      equal(allPlanets.length, 2, 'findRecord() should return all records');
      equal(allPlanets[0].name, 'Earth', 'first matching planet');
      equal(allPlanets[1].name, 'Venus', 'second matching planet');
      return allPlanets;
    });
  });
});

test("#add - creates a record", function() {
  expect(6);

  equal(source.length('planet'), 0, 'source should be empty');

  var original;

  stop();
  source.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    original = planet;
    equal(source.length('planet'), 1, 'source should contain one record');
    ok(planet.id, 'id should be defined');
    equal(planet.name, 'Jupiter', 'name should match');
    equal(planet.classification, 'gas giant', 'classification should match');
    return planet;

  }).then(function(planet) {
    source.find('planet', planet.id).then(function(foundPlanet) {
      start();
      equal(foundPlanet.id, original.id, 'record can be looked up by id');
      return planet;
    });
  });
});

test("#add - creates a record - data defaults to empty object", function() {
  expect(3);

  equal(source.length('planet'), 0, 'source should be empty');

  stop();
  source.add('planet').then(function(planet) {
    start();
    equal(source.length('planet'), 1, 'source should contain one record');
    ok(planet.id, 'id should be defined');
    return planet;
  });
});

test("#add / #remove - can create and remove has-one links and their inverse links", function() {
  expect(10);

  equal(source.length('planet'), 0, 'source should be empty');

  var jupiter, earth,
      io;

  stop();
  source.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}).then(function(planet) {
    jupiter = planet;
    return source.add('moon', {name: 'Io', __rel: {planet: jupiter.id}});

  }).then(function(moon) {
    io = moon;
    equal(Object.keys(jupiter.__rel.moons).length, 1, 'Jupiter has one moon after linking');
    ok(jupiter.__rel.moons[io.id], 'Jupiter\'s moon is Io');
    equal(io.__rel.planet, jupiter.id, 'Io\'s planet is Jupiter');

    return source.add('planet', { name: 'Earth' });
  }).then(function(planet) {
    earth = planet;
    // Change the "inverse" link on the moon by linking it to our new planet
    return source.addLink('planet', earth.id, 'moons', io.id);
  }).then(function() {
    equal(Object.keys(earth.__rel.moons).length, 1, 'Earth has one moon after changing link');
    equal(Object.keys(jupiter.__rel.moons).length, 0, 'Jupiter has no moons after changing link');

    return source.remove('planet', earth.id);
  }).then(function() {
    strictEqual(io.__rel.planet, null, 'Removing earth set io\'s planet to null');
    return source.addLink('moon', io.id, 'planet', jupiter.id);
  }).then(function() {
    equal(Object.keys(jupiter.__rel.moons).length, 1, 'Jupiter has one moon after linking');
    return source.remove('moon', io.id);
  }).then(function() {
    start();

    equal(source.length('moon'), 0, 'moon should be deleted');
    equal(Object.keys(jupiter.__rel.moons).length, 0, 'Jupiter has no moons');
  });
});

test("#add / #remove - can create and remove has-many links and their inverse links", function() {
  expect(6);

  equal(source.length('planet'), 0, 'source should be empty');

  var jupiter,
      io;

  stop();
  source.add('moon', {name: 'Io'}).then(function(moon) {
    io = moon;

    var moons = {};
    moons[io.id] = true;

    return source.add('planet', {name: 'Jupiter', __rel: {moons: moons}});

  }).then(function(planet) {
    jupiter = planet;
    equal(Object.keys(jupiter.__rel.moons).length, 1, 'Jupiter has one moon after linking');
    ok(jupiter.__rel.moons[io.id], 'Jupiter\'s moon is Io');
    equal(io.__rel.planet, jupiter.id, 'Io\'s planet is Jupiter');

    return source.remove('planet', jupiter.id);

  }).then(function() {
    start();

    equal(source.length('planet'), 0, 'planet should be deleted');
    equal(io.__rel.planet, null, 'Io has no planet');
  });
});

test("#transform - remove operation for missing link path should leave a working source", function() {
  expect(3);
  equal(source.length('planet'), 0, 'source should be empty');
  equal(source.length('moon'), 0, 'source should be empty');

  stop();
  source.transform({
    op: 'remove',
    path: ['moon', 'not-there', '__rel', 'planet']
  }).then(function() {
    ok(true, 'transforms continue on');
    start();
  });
});

test("#update - can update records", function() {
  expect(7);

  equal(source.length('planet'), 0, 'source should be empty');

  var original;

  stop();
  source.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    original = planet;
    return source.update('planet', {id: planet.id, name: 'Earth', classification: 'terrestrial'}).then(function() {
      var updatedPlanet = source.retrieve(['planet', planet.id]);
      equal(updatedPlanet.id, planet.id, 'id remains the same');
      equal(updatedPlanet.name, 'Earth', 'name has been updated');
      equal(updatedPlanet.classification, 'terrestrial', 'classification has been updated');
      return planet;
    });

  }).then(function(planet) {
    source.find('planet', planet.id).then(function(foundPlanet) {
      start();
      equal(foundPlanet.id, original.id, 'record can be looked up by id');
      equal(foundPlanet.name, 'Earth', 'name has been updated');
      equal(foundPlanet.classification, 'terrestrial', 'classification has been updated');
      return planet;
    });
  });
});

test("#patch - can patch records", function() {
  expect(5);

  equal(source.length('planet'), 0, 'source should be empty');

  var original;

  stop();
  source.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    original = planet;

    source.patch('planet', planet.id, 'name', 'Earth').then(function() {
      source.find('planet', planet.id).then(function(foundPlanet) {
        start();
        strictEqual(foundPlanet, original, 'still the same object as the one originally inserted');
        equal(foundPlanet.id, planet.id, 'record can be looked up by id');
        equal(foundPlanet.name, 'Earth', 'name has been updated');
        equal(foundPlanet.classification, 'gas giant', 'classification has not been updated');
      });
    });
  });
});

test("#remove - can destroy records", function() {
  expect(3);

  equal(source.length('planet'), 0, 'source should be empty');

  stop();
  source.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    equal(source.length('planet'), 1, 'source should contain one record');
    source.remove('planet', {id: planet.id}).then(function() {
      start();
      equal(source.length('planet'), 0, 'source should be empty');
    });
  });
});

test("#addLink and #removeLink- can link and unlink records in a many-to-one relationship via the 'many' side", function() {
  expect(6);

  equal(source.length('planet'), 0, 'source should be empty');

  var jupiter,
      io;

  stop();
  source.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}).then(function(planet) {
    jupiter = planet;
    return source.add('moon', {name: 'Io'});

  }).then(function(moon) {
    io = moon;

    return source.addLink('planet', jupiter, 'moons', io);

  }).then(function() {
    equal(Object.keys(jupiter.__rel.moons).length, 1, 'Jupiter has one moon after linking');
    ok(jupiter.__rel.moons[io.id], 'Jupiter\'s moon is Io');
    equal(io.__rel.planet, jupiter.id, 'Io\'s planet is Jupiter');

    return source.removeLink('planet', jupiter, 'moons', io);

  }).then(function() {
    start();
    equal(io.__rel.planet, undefined, 'Io is not associated with a planet after unlinking');
    equal(Object.keys(jupiter.__rel.moons).length, 0, 'Jupiter has no moons after unlinking');
  });
});

test("#addLink and #removeLink- can link and unlink records in a many-to-one relationship via the 'one' side", function() {
  expect(6);

  equal(source.length('planet'), 0, 'source should be empty');

  var jupiter,
      io;

  stop();
  source.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}).then(function(planet) {
    jupiter = planet;
    return source.add('moon', {name: 'Io'});

  }).then(function(moon) {
    io = moon;

    return source.addLink('moon', io, 'planet', jupiter);

  }).then(function() {
    equal(Object.keys(jupiter.__rel.moons).length, 1, 'Jupiter has one moon after linking');
    ok(jupiter.__rel.moons[io.id], 'Jupiter\'s moon is Io');
    equal(io.__rel.planet, jupiter.id, 'Io\'s planet is Jupiter');

    return source.removeLink('moon', io, 'planet');

  }).then(function() {
    start();
    equal(io.__rel.planet, undefined, 'Io is not associated with a planet after unlinking');
    equal(Object.keys(jupiter.__rel.moons).length, 0, 'Jupiter has no moons after unlinking');
  });
});

test("#addLink - replacing hasOne relationship removes record from previous hasMany relationship", function(){
  expect(2);
  stop();

  all([
    source.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}),
    source.add('planet', {name: 'Saturn', classification: 'gas giant', atmosphere: true}),
    source.add('moon', {name: 'Io'})

  ]).then(spread(function(jupiter, saturn, io) {

    source.addLink('moon', io.id, 'planet', jupiter).then(function() {
      return source.findLink('planet', jupiter.id, 'moons').then(function(moons) {
        equal(moons[0], io.id);
      });

    }).then(function() {
      return source.addLink('moon', io.id, 'planet', saturn);

    }).then(function() {
      return source.findLink('planet', jupiter.id, 'moons').then(function(moons) {
        start();
        equal(moons.length, 0);
      });
    });
  }));
});


test("#updateLink - will fail when replacing records in a many-to-one relationship unless the linkDef is flagged as `actsAsSet`", function() {
  expect(2);

  equal(source.length('planet'), 0, 'source should be empty');

  var jupiter,
    io;

  stop();
  source.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}).then(function(planet) {
    jupiter = planet;
    return source.add('moon', {name: 'Io'});

  }).then(function(moon) {
    io = moon;
    return source.updateLink('planet', jupiter, 'moons', [ io ]);

  }).then(function() {
    ok(false, 'should not be successful');

  }, function(e) {
    start();
    equal(e.message, "Assertion failed: hasMany links can only be replaced when flagged as `actsAsSet`");
  });
});

test("#updateLink - can link and unlink records in a many-to-one relationship via the 'many' side when it `actsAsSet`", function() {
  expect(6);

  equal(source.length('planet'), 0, 'source should be empty');

  var jupiter,
      io;

  // Moons link must be flagged with `actsAsSet`
  source.schema.models.planet.links.moons.actsAsSet = true;

  stop();
  source.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}).then(function(planet) {
    jupiter = planet;
    return source.add('moon', {name: 'Io'});

  }).then(function(moon) {
    io = moon;

    return source.updateLink('planet', jupiter, 'moons', [ io ]);

  }).then(function() {
    equal(Object.keys(jupiter.__rel.moons).length, 1, 'Jupiter has one moon after linking');

    ok(jupiter.__rel.moons[io.id], 'Jupiter\'s moon is Io');
    equal(io.__rel.planet, jupiter.id, 'Io\'s planet is Jupiter');

    return source.updateLink('planet', jupiter, 'moons', []);

  }).then(function() {
    start();
    equal(io.__rel.planet, undefined, 'Io is not associated with a planet after unlinking');
    equal(Object.keys(jupiter.__rel.moons).length, 0, 'Jupiter has no moons after unlinking');
  });
});

test("#updateLink - can link and unlink records in a many-to-one relationship via the 'one' side", function() {
  expect(4);

  equal(source.length('planet'), 0, 'source should be empty');

  var jupiter,
      io;

  stop();
  source.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}).then(function(planet) {
    jupiter = planet;
    return source.add('moon', {name: 'Io'});

  }).then(function(moon) {
    io = moon;

    return source.updateLink('moon', io, 'planet', jupiter);

  }).then(function() {
    start();
    equal(Object.keys(jupiter.__rel.moons).length, 1, 'Jupiter has one moon after linking');
    ok(jupiter.__rel.moons[io.id], 'Jupiter\'s moon is Io');
    equal(io.__rel.planet, jupiter.id, 'Io\'s planet is Jupiter');

  });
});

test("#findLink - can find has-one linked ids", function() {
  expect(4);

  equal(source.length('planet'), 0, 'source should be empty');

  var jupiter,
      io;

  stop();
  source.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}).then(function(planet) {
    jupiter = planet;
    return source.add('moon', {name: 'Io'});

  }).then(function(moon) {
    io = moon;
    return source.addLink('moon', io, 'planet', jupiter);

  }).then(function() {
    equal(Object.keys(jupiter.__rel.moons).length, 1, 'Jupiter has one moon after linking');
    equal(io.__rel.planet, jupiter.id, 'Io\'s planet is Jupiter');

    return source.findLink('moon', io, 'planet');

  }).then(function(planetId) {
    start();
    equal(planetId, jupiter.id, 'Io is linked to Jupiter');
  });
});

test("#findLinked - can find has-one linked records", function() {
  expect(4);

  equal(source.length('planet'), 0, 'source should be empty');

  var jupiter,
      io;

  stop();
  source.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}).then(function(planet) {
    jupiter = planet;
    return source.add('moon', {name: 'Io'});

  }).then(function(moon) {
    io = moon;
    return source.addLink('moon', io, 'planet', jupiter);

  }).then(function() {
    equal(Object.keys(jupiter.__rel.moons).length, 1, 'Jupiter has one moon after linking');
    equal(io.__rel.planet, jupiter.id, 'Io\'s planet is Jupiter');

    return source.findLinked('moon', io, 'planet');

  }).then(function(planet) {
    start();
    equal(planet.id, jupiter.id, 'Io is linked to Jupiter');
  });
});

test("#findLinked - can find null for an empty has-one relationship", function() {
  expect(4);

  equal(source.length('planet'), 0, 'source should be empty');

  var jupiter,
      io;

  stop();
  source.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}).then(function(planet) {
    jupiter = planet;
    return source.add('moon', {name: 'Io'});

  }).then(function(moon) {
    io = moon;

    equal(Object.keys(jupiter.__rel.moons).length, 0, 'Jupiter has no moons');
    equal(io.__rel.planet, null, 'Io has no planet');

    return source.findLinked('moon', io, 'planet');

  }).then(function(planet) {
    start();
    equal(planet, null, 'Io has no planet: findLinked returned null');
  });
});

test("#findLink - can find has-many linked values", function() {
  expect(5);

  equal(source.length('planet'), 0, 'source should be empty');

  var jupiter,
      io;

  stop();
  source.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}).then(function(planet) {
    jupiter = planet;
    return source.add('moon', {name: 'Io'});

  }).then(function(moon) {
    io = moon;

    return source.addLink('planet', jupiter, 'moons', io);

  }).then(function() {
    equal(Object.keys(jupiter.__rel.moons).length, 1, 'Jupiter has one moon after linking');
    equal(io.__rel.planet, jupiter.id, 'Io\'s planet is Jupiter');

    return source.findLink('planet', jupiter, 'moons');

  }).then(function(moonIds) {
    start();
    equal(moonIds.length, 1, 'Jupiter has one moon');
    equal(moonIds[0], io.id, '... and it\'s Io');
  });
});

test("#findLinked - can find has-many linked values", function() {
  expect(5);

  equal(source.length('planet'), 0, 'source should be empty');

  var jupiter,
      io;

  stop();
  source.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}).then(function(planet) {
    jupiter = planet;
    return source.add('moon', {name: 'Io'});

  }).then(function(moon) {
    io = moon;

    return source.addLink('planet', jupiter, 'moons', io);

  }).then(function() {
    equal(Object.keys(jupiter.__rel.moons).length, 1, 'Jupiter has one moon after linking');
    equal(io.__rel.planet, jupiter.id, 'Io\'s planet is Jupiter');

    return source.findLinked('planet', jupiter, 'moons');

  }).then(function(moons) {
    start();
    equal(moons.length, 1, 'Jupiter has one moon');
    equal(moons[0].name, 'Io', '... and Io is its name');
  });
});

test("#findLinked - can find an empty set of has-many linked values", function() {
  expect(4);

  equal(source.length('planet'), 0, 'source should be empty');

  var jupiter,
      io;

  stop();
  source.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}).then(function(planet) {
    jupiter = planet;
    return source.add('moon', {name: 'Io'});

  }).then(function(moon) {
    io = moon;

    equal(Object.keys(jupiter.__rel.moons).length, 0, 'Jupiter has no moons');
    equal(io.__rel.planet, null, 'Io has no planet');

    return source.findLinked('planet', jupiter, 'moons');

  }).then(function(moons) {
    start();
    equal(moons.length, 0, 'Jupiter has no moons: findLinked returned []');
  });
});

test("#findLink - returns LinkNotFoundException for a link that doesn't exist", function() {
  expect(2);

  equal(source.length('planet'), 0, 'source should be empty');

  var jupiter,
      io;

  stop();
  source.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}).then(function(planet) {
    jupiter = planet;

    source.findLink('planet', jupiter, 'bogus').then(function(foundLink) {
      ok(false, 'no link should be found');
    }, function(e) {
      start();
      ok(e instanceof LinkNotFoundException, 'LinkNotFoundException thrown');
    });
  });
});

test("#findLink - returns RecordNotFoundException for a record that doesn't exist", function() {
  expect(2);

  equal(source.length('planet'), 0, 'source should be empty');

  var jupiter,
      io;

  stop();
  source.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}).then(function(planet) {
    jupiter = planet;

    source.findLink('planet', 'bogus', 'moons').then(function(foundLink) {
      ok(false, 'no link should be found');
    }, function(e) {
      start();
      ok(e instanceof RecordNotFoundException, 'RecordNotFoundException thrown');
    });
  });
});
