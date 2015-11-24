import Orbit from 'orbit/main';
import Schema from 'orbit-common/schema';
import Store from 'orbit-common/store';
import { resolve, Promise } from 'rsvp';
import Transform from 'orbit/transform';
import {
  addRecordOperation,
  replaceRecordOperation,
  removeRecordOperation,
  replaceAttributeOperation,
  addToRelationshipOperation,
  removeFromRelationshipOperation,
  replaceRelationshipOperation
} from 'orbit-common/lib/operations';
import { asyncTest, transformMatching } from 'tests/test-helper';

const stub = sinon.stub;

const schemaDefinition = {
  models: {
    star: {
      attributes: {
        name: {type: 'string'}
      },
      relationships: {
        planets: {type: 'hasMany', model: 'planet', inverse: 'star'}
      }
    },
    planet: {
      attributes: {
        name: {type: 'string'},
        classification: {type: 'string'}
      },
      relationships: {
        moons: {type: 'hasMany', model: 'moon', inverse: 'planet'},
        star: {type: 'hasOne', model: 'star', inverse: 'planets'}
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
};

let store,
    schema,
    didTransform;

module('OC - Store', {
  setup() {
    Orbit.Promise = Promise;

    schema = new Schema(schemaDefinition);
    store = new Store({schema});

    didTransform = stub().returns(resolve());
    store.on('transform', didTransform);
  },

  teardown() {
    schema = null;
    Orbit.Promise = null;
  }
});

test("#findRecord - returns a record found by type and id", function() {
  expect(1);

  let earth = schema.normalize({id: 'earth', type: 'planet', relationships: { moons: { data: {'moon:io': true} } }});

  store.cache.reset({
    planet: { earth }
  });

  stop();
  store.findRecord('planet', 'earth')
    .then(function(foundPlanet) {
      start();
      strictEqual(foundPlanet, earth, 'correct planet has been found');
    });
});

test("#findRecord - returns undefined when a record can't be found", function() {
  expect(1);

  store.cache.reset({
  });

  stop();
  store.findRecord('planet', 'earth')
    .then(function(foundPlanet) {
      start();
      strictEqual(foundPlanet, undefined, 'planet could not be found');
    });
});

test("#findRecordsByType - returns all records of a particular type", function() {
  expect(1);

  let earth = schema.normalize({id: 'earth', type: 'planet', relationships: { moons: { data: {'moon:io': true} } }});
  let jupiter = schema.normalize({id: 'jupiter', type: 'planet'});
  let io = schema.normalize({id: 'io', type: 'moon', relationships: { planet: {data: 'planet:earth'} }});

  store.cache.reset({
    planet: { earth, jupiter },
    moon: { io }
  });

  stop();
  store.findRecordsByType('planet')
    .then(function(planets) {
      start();
      deepEqual(planets, [earth, jupiter], 'planets have been found');
    });
});

test("#findRecordsByType - returns an empty array when there's no data", function() {
  expect(1);

  store.cache.reset({
  });

  stop();
  store.findRecordsByType('planet')
    .then(function(planets) {
      start();
      deepEqual(planets, [], 'no planets have been found');
    });
});

test('#addRecord - added record', function({async}) {
  let done = async();
  let newRecord = {type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant'}};
  let normalizedRecord = schema.normalize(newRecord);
  let expectedTransform = new Transform([ addRecordOperation(normalizedRecord) ]);

  store.addRecord(newRecord)
    .then(function(addedRecord) {

      ok(addedRecord.id, 'has an id assigned');
      deepEqual(addedRecord.attributes, newRecord.attributes, 'has attributes assigned');
      deepEqual(addedRecord.relationships.moons, { data: undefined }, 'has initialized hasMany relationships');
      deepEqual(addedRecord.relationships.star, { data: undefined }, 'has initialized hasOne relationships');
      deepEqual(store.cache.get(['planet', addedRecord.id]), addedRecord, 'is available for retrieval from the cache');
      ok(didTransform.calledWith(transformMatching(expectedTransform)), 'operation has been emitted as a transform');

      done();
    });
});

test('#replaceRecord - replaced record', function({async}) {
  let done = async();
  let pluto = schema.normalize({ id: 'pluto', type: 'planet', attributes: {name: 'pluto'} });
  let plutoReplacement = schema.normalize({ id: 'pluto', type: 'planet', attributes: {name: 'pluto returns'} });
  let replaceRecordTransform = new Transform([ replaceRecordOperation(plutoReplacement) ]);

  store.cache.reset({
    planet: { pluto }
  });

  store.replaceRecord(plutoReplacement)
    .then(function(){

      ok(didTransform.calledWith(transformMatching(replaceRecordTransform)), 'operation has been emitted as a transform');
      deepEqual(store.cache.get(['planet', 'pluto']), plutoReplacement);

      done();
    });
});

test('#removeRecord - deleted record', function({async}) {
  let done = async();
  let pluto = schema.normalize({ id: 'pluto', type: 'planet', attributes: {name: 'pluto'} });
  let removeRecordTransform = new Transform([ removeRecordOperation(pluto) ]);

  store.cache.reset({
    planet: { pluto }
  });

  store.removeRecord(pluto)
    .then(function(){

      ok(didTransform.calledWith(transformMatching(removeRecordTransform)), 'operation has been emitted as a transform');
      ok(!store.cache.get(['planet', 'pluto']), 'has been removed from store');

      done();
    });
});

test('#replaceAttribute', function({async}){
  let done = async();
  let pluto = schema.normalize({ id: 'pluto', type: 'planet', attributes: {name: 'pluto'} });
  let replaceAttributeTransform = new Transform([ replaceAttributeOperation(pluto, 'name', 'pluto returns') ]);

  store.cache.reset({
    planet: { pluto }
  });

  store.replaceAttribute(pluto, 'name', 'pluto returns')
    .then(function(){

      ok(didTransform.calledWith(transformMatching(replaceAttributeTransform)), 'operation has been emitted as a transform');

      done();
    });
});

test('#addToRelationship - hasMany', function({async}) {
  let done = async();
  let earth = schema.normalize({id: 'earth', type: 'planet'});
  let io = schema.normalize({id: 'io', type: 'moon'});
  let addToRelationshipTransform = new Transform([ addToRelationshipOperation(earth, 'moons', io) ]);

  store.cache.reset({
    planet: { earth },
    moon: { io }
  });

  store.addToRelationship(earth, 'moons', io)
    .then(function(){

      ok(didTransform.calledWith(transformMatching(addToRelationshipTransform)), 'operation has been emitted as a transform');
      deepEqual(earth.relationships.moons.data, {'moon:io': true}, 'added to hasMany');

      done();
    });
});

test('#addToRelationship - hasOne', function({async}) {
  let done = async();
  let earth = schema.normalize({id: 'earth', type: 'planet'});
  let io = schema.normalize({id: 'io', type: 'moon'});
  let addToRelationshipTransform = new Transform([ addToRelationshipOperation(io, 'planet', earth) ]);

  store.cache.reset({
    planet: { earth },
    moon: { io }
  });

  store.addToRelationship(io, 'planet', earth)
    .then(function(){

      ok(didTransform.calledWith(transformMatching(addToRelationshipTransform)), 'operation has been emitted as a transform');
      deepEqual(io.relationships.planet.data, 'planet:earth', 'added to hasOne');

      done();
    });
});

test('#removeFromRelationship - hasMany', function({async}) {
  let done = async();
  let earth = schema.normalize({id: 'earth', type: 'planet', relationships: { moons: { data: { 'moon:io': true } } }});
  let io = schema.normalize({id: 'io', type: 'moon', relationships: { planet: {data: 'planet:earth'} }});
  let removeFromRelationshipTransform = new Transform([ removeFromRelationshipOperation(earth, 'moons', io) ]);

  store.cache.reset({
    planet: { earth },
    moon: { io }
  });

  store.removeFromRelationship(earth, 'moons', io)
    .then(function(){

      ok(didTransform.calledWith(transformMatching(removeFromRelationshipTransform)), 'operation has been emitted as a transform');
      deepEqual(earth.relationships.moons.data, {}, 'removed from hasMany');
      deepEqual(io.relationships.planet.data, null, 'removed from inverse');

      done();
    });
});

test('#replaceRelationship - hasMany', function({async}) {
  let done = async();
  let earth = schema.normalize({id: 'earth', type: 'planet', relationships: { moons: { data: { 'moon:io': true } } }});
  let io = schema.normalize({id: 'io', type: 'moon', relationships: { planet: {data: 'planet:earth'} }});
  let titan = schema.normalize({id: 'titan', type: 'moon'});
  let replaceRelationshipTransform = new Transform([ replaceRelationshipOperation(earth, 'moons', [titan]) ]);

  store.cache.reset({
    planet: { earth },
    moon: { io, titan }
  });

  store.replaceRelationship(earth, 'moons', [titan])
    .then(function(){

      ok(didTransform.calledWith(transformMatching(replaceRelationshipTransform)), 'operation has been emitted as a transform');
      deepEqual(earth.relationships.moons.data, {'moon:titan': true}, 'replaced hasMany');
      deepEqual(io.relationships.planet.data, null, 'updated inverse on removed records');
      deepEqual(titan.relationships.planet.data, 'planet:earth', 'updated inverse on added records');

      done();
    });
});

test('#replaceRelationship - hasOne', function({async}) {
  let done = async();
  let earth = schema.normalize({id: 'earth', type: 'planet', relationships: { moons: { data: {'moon:io': true} } }});
  let jupiter = schema.normalize({id: 'jupiter', type: 'planet'});
  let io = schema.normalize({id: 'io', type: 'moon', relationships: { planet: {data: 'planet:earth'} }});
  let replaceRelationshipTransform = new Transform([ replaceRelationshipOperation(io, 'planet', jupiter) ]);

  store.cache.reset({
    planet: { earth, jupiter },
    moon: { io }
  });

  store.replaceRelationship(io, 'planet', jupiter)
    .then(function(){

      ok(didTransform.calledWith(transformMatching(replaceRelationshipTransform)), 'operation has been emitted as a transform');
      deepEqual(io.relationships.planet.data, 'planet:jupiter', 'updated hasOne');
      deepEqual(earth.relationships.moons.data, {}, 'updated inverse on removed records');
      deepEqual(jupiter.relationships.moons.data, {'moon:io': true}, 'updated inverse on added records');
      done();
    });
});

// TODO - adapt tests previously from MemorySource
//
// test("#addRecord / #removeRecord - can create and remove has-one links and their inverse links", function() {
//   expect(10);
//
//   equal(source.length('planet'), 0, 'source should be empty');
//
//   var jupiter, earth,
//       io;
//
//   stop();
//   source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant', atmosphere: true}})
//     .then(function(planet) {
//       jupiter = planet;
//       return source.addRecord({type: 'moon', attributes: {name: 'Io'}, relationships: {planet: {data: toIdentifier('planet', jupiter.id)}}});
//     })
//     .then(function(moon) {
//       io = moon;
//       equal(Object.keys(jupiter.relationships.moons).length, 1, 'Jupiter has one moon after linking');
//       ok(jupiter.relationships.moons.data[toIdentifier('moon', io.id)], 'Jupiter\'s moon is Io');
//       equal(io.relationships.planet.data, toIdentifier('planet', jupiter.id), 'Io\'s planet is Jupiter');
//
//       return source.addRecord({type: 'planet', attributes: { name: 'Earth' }});
//     })
//     .then(function(planet) {
//       earth = planet;
//       // Change the "inverse" link on the moon by linking it to our new planet
//       return source.addToRelationship(earth, 'moons', io);
//     })
//     .then(function() {
//       equal(Object.keys(earth.relationships.moons.data).length, 1, 'Earth has one moon after changing link');
//       equal(Object.keys(jupiter.relationships.moons.data).length, 0, 'Jupiter has no moons after changing link');
//
//       return source.removeRecord(earth);
//     })
//     .then(function() {
//       strictEqual(io.relationships.planet.data, undefined, 'Removing earth set io\'s planet to undefined');
//       return source.replaceRelationship(io, 'planet', jupiter);
//     })
//     .then(function() {
//       equal(Object.keys(jupiter.relationships.moons.data).length, 1, 'Jupiter has one moon after linking');
//       return source.removeRecord(io);
//     })
//     .then(function() {
//       start();
//
//       equal(source.length('moon'), 0, 'moon should be deleted');
//       equal(Object.keys(jupiter.relationships.moons.data).length, 0, 'Jupiter has no moons');
//     });
// });
//
// test("#addRecord / #removeRecord - can create and remove has-many links and their inverse links", function() {
//   expect(6);
//
//   equal(source.length('planet'), 0, 'source should be empty');
//
//   var jupiter,
//       io;
//
//   stop();
//   source.addRecord({type: 'moon', attributes: {name: 'Io'}})
//     .then(function(moon) {
//       io = moon;
//
//       var moons = {};
//       moons[toIdentifier('moon', io.id)] = true;
//
//       return source.addRecord({type: 'planet', attributes: {name: 'Jupiter'}, relationships: {moons: {data: moons}}});
//     })
//     .then(function(planet) {
//       jupiter = planet;
//       equal(Object.keys(jupiter.relationships.moons.data).length, 1, 'Jupiter has one moon after linking');
//       ok(jupiter.relationships.moons.data[toIdentifier('moon', io.id)], 'Jupiter\'s moon is Io');
//       equal(io.relationships.planet.data, toIdentifier('planet', jupiter.id), 'Io\'s planet is Jupiter');
//
//       return source.removeRecord(jupiter);
//     })
//     .then(function() {
//       start();
//
//       equal(source.length('planet'), 0, 'planet should be deleted');
//       equal(io.relationships.planet.data, undefined, 'Io has no planet');
//     });
// });
//
// test("#transform - remove operation for missing link path should leave a working source", function() {
//   expect(3);
//   equal(source.length('planet'), 0, 'source should be empty');
//   equal(source.length('moon'), 0, 'source should be empty');
//
//   stop();
//   source.transform({
//     op: 'remove',
//     path: ['moon', 'not-there', 'relationships', 'planet', 'data']
//   }).then(function() {
//     ok(true, 'transforms continue on');
//     start();
//   });
// });
//
// test("#addToRelationship and #removeFromRelationship - can link and unlink records in a many-to-one relationship via the 'many' side", function() {
//   expect(6);
//
//   equal(source.length('planet'), 0, 'source should be empty');
//
//   var jupiter,
//       io;
//
//   stop();
//   source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant', atmosphere: true}})
//     .then(function(planet) {
//       jupiter = planet;
//       return source.addRecord({type: 'moon', attributes: {name: 'Io'}});
//     })
//     .then(function(moon) {
//       io = moon;
//       return source.addToRelationship(jupiter, 'moons', io);
//     })
//     .then(function() {
//       equal(Object.keys(jupiter.relationships.moons.data).length, 1, 'Jupiter has one moon after linking');
//       equal(jupiter.relationships.moons.data[toIdentifier('moon', io.id)], true, 'Jupiter\'s moon is Io');
//       equal(io.relationships.planet.data, toIdentifier('planet', jupiter.id), 'Io\'s planet is Jupiter');
//       return source.removeFromRelationship(jupiter, 'moons', io);
//     })
//     .then(function() {
//       start();
//       equal(io.relationships.planet.data, undefined, 'Io is not associated with a planet after unlinking');
//       equal(Object.keys(jupiter.relationships.moons.data).length, 0, 'Jupiter has no moons after unlinking');
//     });
// });
//
// test("#addToRelationship and #removeFromRelationship - can link and unlink records in a many-to-one relationship via the 'one' side", function() {
//   expect(6);
//
//   equal(source.length('planet'), 0, 'source should be empty');
//
//   var jupiter,
//       io;
//
//   stop();
//   source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant', atmosphere: true}})
//     .then(function(planet) {
//       jupiter = planet;
//       return source.addRecord({type: 'moon', attributes: {name: 'Io'}});
//     })
//     .then(function(moon) {
//       io = moon;
//       return source.addToRelationship(io, 'planet', jupiter);
//     })
//     .then(function() {
//       equal(Object.keys(jupiter.relationships.moons.data).length, 1, 'Jupiter has one moon after linking');
//       ok(jupiter.relationships.moons.data[toIdentifier('moon', io.id)], 'Jupiter\'s moon is Io');
//       equal(io.relationships.planet.data, toIdentifier('planet', jupiter.id), 'Io\'s planet is Jupiter');
//       return source.replaceRelationship(io, 'planet', undefined);
//     })
//     .then(function() {
//       start();
//       equal(io.relationships.planet.data, undefined, 'Io is not associated with a planet after unlinking');
//       equal(Object.keys(jupiter.relationships.moons.data).length, 0, 'Jupiter has no moons after unlinking');
//     });
// });
//
// test("#addToRelationship - replacing hasOne relationship removes record from previous hasMany relationship", function(){
//   expect(2);
//   stop();
//
//   var jupiter, saturn, io;
//
//   all([
//     source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant', atmosphere: true}}),
//     source.addRecord({type: 'planet', attributes: {name: 'Saturn', classification: 'gas giant', atmosphere: true}}),
//     source.addRecord({type: 'moon', attributes: {name: 'Io'}})
//   ])
//     .then(spread(function(a, b, c) {
//       jupiter = a;
//       saturn = b;
//       io = c;
//       return source.replaceRelationship(io, 'planet', jupiter);
//     }))
//     .then(function() {
//       return source.findRelationship(jupiter, 'moons');
//     })
//     .then(function(moons) {
//       deepEqual(moons[0], {type: 'moon', id: io.id});
//       return source.replaceRelationship(io, 'planet', saturn);
//     })
//     .then(function() {
//       return source.findRelationship(jupiter, 'moons');
//     })
//     .then(function(moons) {
//       start();
//       equal(moons.length, 0);
//     });
// });
//
// // TODO - evaluate necessity of `actsAsSet`
// //
// // test("#replaceRelationship - will fail when replacing records in a many-to-one relationship unless the linkDef is flagged as `actsAsSet`", function() {
// //   expect(2);
// //
// //   equal(source.length('planet'), 0, 'source should be empty');
// //
// //   var jupiter,
// //     io;
// //
// //   stop();
// //   source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant', atmosphere: true}})
// //     .then(function(planet) {
// //       jupiter = planet;
// //       return source.addRecord({type: 'moon', attributes: {name: 'Io'}});
// //     })
// //     .then(function(moon) {
// //       io = moon;
// //       return source.replaceRelationship(jupiter, 'moons', [ io ]);
// //     })
// //     .then(function() {
// //       ok(false, 'should not be successful');
// //     }, function(e) {
// //       start();
// //       equal(e.message, "Assertion failed: hasMany links can only be replaced when flagged as `actsAsSet`");
// //     });
// // });
//
// test("#replaceRelationship - can link and unlink records in a many-to-one relationship via the 'many' side when it `actsAsSet`", function() {
//   expect(6);
//
//   equal(source.length('planet'), 0, 'source should be empty');
//
//   var jupiter,
//       io;
//
//   // Moons link must be flagged with `actsAsSet`
//   source.schema.models.planet.relationships.moons.actsAsSet = true;
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
//       equal(Object.keys(jupiter.relationships.moons.data).length, 1, 'Jupiter has one moon after linking');
//
//       equal(jupiter.relationships.moons.data[toIdentifier('moon', io.id)], true, 'Jupiter\'s moon is Io');
//       equal(io.relationships.planet.data, toIdentifier('planet', jupiter.id), 'Io\'s planet is Jupiter');
//
//       return source.replaceRelationship(jupiter, 'moons', []);
//     })
//     .then(function() {
//       start();
//       equal(io.relationships.planet.data, undefined, 'Io is not associated with a planet after unlinking');
//       equal(Object.keys(jupiter.relationships.moons.data).length, 0, 'Jupiter has no moons after unlinking');
//     });
// });
//
// test("#replaceRelationship - can link and unlink records in a many-to-one relationship via the 'one' side", function() {
//   expect(4);
//
//   equal(source.length('planet'), 0, 'source should be empty');
//
//   var jupiter,
//       io;
//
//   stop();
//   source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant', atmosphere: true}})
//     .then(function(planet) {
//       jupiter = planet;
//       return source.addRecord({type: 'moon', attributes: {name: 'Io'}});
//     })
//     .then(function(moon) {
//       io = moon;
//       return source.replaceRelationship(io, 'planet', jupiter);
//     })
//     .then(function() {
//       start();
//       equal(Object.keys(jupiter.relationships.moons.data).length, 1, 'Jupiter has one moon after linking');
//       equal(jupiter.relationships.moons.data[toIdentifier('moon', io.id)], true, 'Jupiter\'s moon is Io');
//       equal(io.relationships.planet.data, toIdentifier('planet', jupiter.id), 'Io\'s planet is Jupiter');
//     });
// });
//
// test("#findRelationship - can find has-one linked ids", function() {
//   expect(4);
//
//   equal(source.length('planet'), 0, 'source should be empty');
//
//   var jupiter,
//       io;
//
//   stop();
//   source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant', atmosphere: true}})
//     .then(function(planet) {
//       jupiter = planet;
//       return source.addRecord({type: 'moon', attributes: {name: 'Io'}});
//     })
//     .then(function(moon) {
//       io = moon;
//       return source.replaceRelationship(io, 'planet', jupiter);
//     })
//     .then(function() {
//       equal(Object.keys(jupiter.relationships.moons.data).length, 1, 'Jupiter has one moon after linking');
//       equal(io.relationships.planet.data, toIdentifier('planet', jupiter.id), 'Io\'s planet is Jupiter');
//       return source.findRelationship(io, 'planet');
//     })
//     .then(function(planetId) {
//       start();
//       deepEqual(planetId, {type: 'planet', id: jupiter.id}, 'Io is linked to Jupiter');
//     });
// });
//
// test("#findRelated - can find has-one linked records", function() {
//   expect(4);
//
//   equal(source.length('planet'), 0, 'source should be empty');
//
//   var jupiter,
//       io;
//
//   stop();
//   source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant', atmosphere: true}})
//     .then(function(planet) {
//       jupiter = planet;
//       return source.addRecord({type: 'moon', attributes: {name: 'Io'}});
//     })
//     .then(function(moon) {
//       io = moon;
//       return source.replaceRelationship(io, 'planet', jupiter);
//     })
//     .then(function() {
//       equal(Object.keys(jupiter.relationships.moons.data).length, 1, 'Jupiter has one moon after linking');
//       equal(io.relationships.planet.data, toIdentifier('planet', jupiter.id), 'Io\'s planet is Jupiter');
//       return source.findRelated(io, 'planet');
//     })
//     .then(function(planet) {
//       start();
//       equal(planet.id, jupiter.id, 'Io is linked to Jupiter');
//     });
// });
//
// test("#findRelated - can find null for an empty has-one relationship", function() {
//   expect(4);
//
//   equal(source.length('planet'), 0, 'source should be empty');
//
//   var jupiter,
//       io;
//
//   stop();
//   source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant', atmosphere: true}})
//     .then(function(planet) {
//       jupiter = planet;
//       return source.addRecord({type: 'moon', attributes: {name: 'Io'}});
//     })
//     .then(function(moon) {
//       io = moon;
//
//       equal(jupiter.relationships.moons.data, undefined, 'Jupiter has no moons');
//       equal(io.relationships.planet.data, undefined, 'Io has no planet');
//
//       return source.findRelated(io, 'planet');
//     })
//     .then(function(planet) {
//       start();
//       equal(planet, undefined, 'Io has no planet: findRelated returned undefined');
//     });
// });
//
// test("#findRelationship - can find has-many linked values", function() {
//   expect(5);
//
//   equal(source.length('planet'), 0, 'source should be empty');
//
//   var jupiter,
//       io;
//
//   stop();
//   source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant', atmosphere: true}})
//     .then(function(planet) {
//       jupiter = planet;
//       return source.addRecord({type: 'moon', attributes: {name: 'Io'}});
//     })
//     .then(function(moon) {
//       io = moon;
//       return source.addToRelationship(jupiter, 'moons', io);
//     })
//     .then(function() {
//       equal(Object.keys(jupiter.relationships.moons.data).length, 1, 'Jupiter has one moon after linking');
//       equal(io.relationships.planet.data, toIdentifier('planet', jupiter.id), 'Io\'s planet is Jupiter');
//
//       return source.findRelationship(jupiter, 'moons');
//     })
//     .then(function(moonIds) {
//       start();
//       equal(moonIds.length, 1, 'Jupiter has one moon');
//       equal(moonIds[0].id, io.id, '... and it\'s Io');
//     });
// });
//
// test("#findRelated - can find has-many linked values", function() {
//   expect(5);
//
//   equal(source.length('planet'), 0, 'source should be empty');
//
//   var jupiter,
//       io;
//
//   stop();
//   source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant', atmosphere: true}})
//     .then(function(planet) {
//       jupiter = planet;
//       return source.addRecord({type: 'moon', attributes: {name: 'Io'}});
//     })
//     .then(function(moon) {
//       io = moon;
//       return source.addToRelationship(jupiter, 'moons', io);
//     })
//     .then(function() {
//       equal(Object.keys(jupiter.relationships.moons.data).length, 1, 'Jupiter has one moon after linking');
//       equal(io.relationships.planet.data, toIdentifier('planet', jupiter.id), 'Io\'s planet is Jupiter');
//       return source.findRelated(jupiter, 'moons');
//     })
//     .then(function(moons) {
//       start();
//       equal(moons.length, 1, 'Jupiter has one moon');
//       equal(moons[0].attributes.name, 'Io', '... and Io is its name');
//     });
// });
//
// test("#findRelated - can find an empty set of has-many linked values", function() {
//   expect(4);
//
//   equal(source.length('planet'), 0, 'source should be empty');
//
//   var jupiter,
//       io;
//
//   stop();
//   source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant', atmosphere: true}})
//     .then(function(planet) {
//       jupiter = planet;
//       return source.addRecord({type: 'moon', attributes: {name: 'Io'}});
//     })
//     .then(function(moon) {
//       io = moon;
//
//       equal(jupiter.relationships.moons.data, undefined, 'Jupiter has no moons');
//       equal(io.relationships.planet.data, undefined, 'Io has no planet');
//
//       return source.findRelated(jupiter, 'moons');
//     })
//     .then(function(moons) {
//       start();
//       equal(moons, undefined, 'Jupiter has no moons: findRelated returned undefined');
//     });
// });

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
