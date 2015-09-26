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

let schemaDefinition = {
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
      modelDefaults: {
        defaultValue: 'planetId1'
      },
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
    store.on('didTransform', didTransform);
  },

  teardown() {
    schema = null;
    Orbit.Promise = null;
  }
});

test('#addRecord - added record', function({async}) {
  const done = async();
  const newRecord = {type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant'}};
  const normalizedRecord = schema.normalize(newRecord);
  const expectedTransform = new Transform([ addRecordOperation(normalizedRecord) ]);

  store.addRecord(newRecord)
    .then(function(addedRecord) {

      ok(addedRecord.id, 'has an id assigned');
      deepEqual(addedRecord.attributes, newRecord.attributes, 'has attributes assigned');
      deepEqual(addedRecord.relationships.moons, { data: undefined }, 'has initialized hasMany relationships');
      deepEqual(addedRecord.relationships.star, { data: undefined }, 'has initialized hasOne relationships');
      deepEqual(store.retrieve(['planet', addedRecord.id]), addedRecord, 'is available for retrieval from store');
      ok(didTransform.calledWith(transformMatching(expectedTransform)), 'operation has been emitted as a transform');

      done();
    });
});

test('#replaceRecord - replaced record', function({async}) {
  const done = async();
  const pluto = schema.normalize({ id: 'pluto', type: 'planet', attributes: {name: 'pluto'} });
  const plutoReplacement = schema.normalize({ id: 'pluto', type: 'planet', attributes: {name: 'pluto returns'} });
  const replaceRecordTransform = new Transform([ replaceRecordOperation(plutoReplacement) ]);

  store.reset({
    planet: { pluto }
  });

  store.replaceRecord(plutoReplacement)
    .then(function(){

      ok(didTransform.calledWith(transformMatching(replaceRecordTransform)), 'operation has been emitted as a transform');
      deepEqual(store.retrieve(['planet', 'pluto']), plutoReplacement);

      done();
    });
});

test('#removeRecord - deleted record', function({async}) {
  const done = async();
  const pluto = schema.normalize({ id: 'pluto', type: 'planet', attributes: {name: 'pluto'} });
  const removeRecordTransform = new Transform([ removeRecordOperation(pluto) ]);

  store.reset({
    planet: { pluto }
  });

  store.removeRecord(pluto)
    .then(function(){

      ok(didTransform.calledWith(transformMatching(removeRecordTransform)), 'operation has been emitted as a transform');
      ok(!store.retrieve(['planet', 'pluto']), 'has been removed from store');

      done();
    });
});

test('#replaceAttribute', function({async}){
  const done = async();
  const pluto = schema.normalize({ id: 'pluto', type: 'planet', attributes: {name: 'pluto'} });
  const replaceAttributeTransform = new Transform([ replaceAttributeOperation(pluto, 'name', 'pluto returns') ]);

  store.reset({
    planet: { pluto }
  });

  store.replaceAttribute(pluto, 'name', 'pluto returns')
    .then(function(){

      ok(didTransform.calledWith(transformMatching(replaceAttributeTransform)), 'operation has been emitted as a transform');

      done();
    });
});

test('#addToRelationship - hasMany', function({async}) {
  const done = async();
  const earth = schema.normalize({id: 'earth', type: 'planet'});
  const io = schema.normalize({id: 'io', type: 'moon'});
  const addToRelationshipTransform = new Transform([ addToRelationshipOperation(earth, 'moons', io) ]);

  store.reset({
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
  const done = async();
  const earth = schema.normalize({id: 'earth', type: 'planet'});
  const io = schema.normalize({id: 'io', type: 'moon'});
  const addToRelationshipTransform = new Transform([ addToRelationshipOperation(io, 'planet', earth) ]);

  store.reset({
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
  const done = async();
  const earth = schema.normalize({id: 'earth', type: 'planet', relationships: { moons: { data: { 'moon:io': true } } }});
  const io = schema.normalize({id: 'io', type: 'moon', relationships: { planet: {data: 'planet:earth'} }});
  const removeFromRelationshipTransform = new Transform([ removeFromRelationshipOperation(earth, 'moons', io) ]);

  store.reset({
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
  const done = async();
  const earth = schema.normalize({id: 'earth', type: 'planet', relationships: { moons: { data: { 'moon:io': true } } }});
  const io = schema.normalize({id: 'io', type: 'moon', relationships: { planet: {data: 'planet:earth'} }});
  const titan = schema.normalize({id: 'titan', type: 'moon'});
  const replaceRelationshipTransform = new Transform([ replaceRelationshipOperation(earth, 'moons', [titan]) ]);

  store.reset({
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
  const done = async();
  const earth = schema.normalize({id: 'earth', type: 'planet', relationships: { moons: { data: {'moon:io': true} } }});
  const jupiter = schema.normalize({id: 'jupiter', type: 'planet'});
  const io = schema.normalize({id: 'io', type: 'moon', relationships: { planet: {data: 'planet:earth'} }});
  const replaceRelationshipTransform = new Transform([ replaceRelationshipOperation(io, 'planet', jupiter) ]);

  store.reset({
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
