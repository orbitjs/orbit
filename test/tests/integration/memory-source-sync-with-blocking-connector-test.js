import Orbit from 'orbit/main';
import { uuid } from 'orbit/lib/uuid';
import Schema from 'orbit-common/schema';
import MemorySource from 'orbit-common/memory-source';
import TransformConnector from 'orbit/transform-connector';
import { Promise } from 'rsvp';

var schema,
    source1,
    source2,
    source1to2Connector,
    source2to1Connector;

module("Integration - Memory Source Sync (Blocking)", {
  setup: function() {
    Orbit.Promise = Promise;

    // Create schema
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
            planet: {type: 'hasOne', model: 'planet', inverse: 'moons'},
            mountains: {type: 'hasMany', model: 'mountain', inverse: 'moon'}
          }
        }
      }
    });

    // Create sources
    source1 = new MemorySource(schema);
    source2 = new MemorySource(schema);

    source1.id = 'source1';
    source2.id = 'source2';

    // Create connectors
    source1to2Connector = new TransformConnector(source1, source2);
    source2to1Connector = new TransformConnector(source2, source1);

    source1.on('rescueFind', source2.find);
  },

  teardown: function() {
    source1to2Connector = source2to1Connector = null;
    source1 = source2 = null;
  }
});

test("consecutive transforms can be applied to one source and should be automatically applied to the other source", function() {
  expect(4);

  stop();

  source1.transform({
    op: 'add',
    path: ['planet', '123'],
    value: source1.normalize('planet', {name: 'Jupiter'})
  });

  source1.transform({
    op: 'replace',
    path: ['planet', '123', 'name'],
    value: 'Earth'

  }).then(function() {
    source1.find('planet', '123').then(function(planet1) {
      source2.find('planet', '123').then(function(planet2) {
        start();
        notStrictEqual(planet2, planet1, 'not the same object as the one originally inserted');
        equal(planet2.__id, planet1.__id, 'backup record has the same primary id');
        equal(planet2.name, planet1.name, 'backup record has the same name');
        equal(planet2.name, 'Earth', 'records have the updated name');
      });
    });
  });
});

test("an array of transforms can be applied to one source and should be automatically applied to the other source", function() {
  expect(4);

  stop();

  source1.transform([{
    op: 'add',
    path: ['planet', '123'],
    value: source1.normalize('planet', {name: 'Jupiter'})
  }, {
    op: 'replace',
    path: ['planet', '123', 'name'],
    value: 'Earth'
  }]).then(function() {
    source1.find('planet', '123').then(function(planet1) {
      source2.find('planet', '123').then(function(planet2) {
        start();
        notStrictEqual(planet2, planet1, 'not the same object as the one originally inserted');
        equal(planet2.__id, planet1.__id, 'backup record has the same primary id');
        equal(planet2.name, planet1.name, 'backup record has the same name');
        equal(planet2.name, 'Earth', 'records have the updated name');
      });
    });
  });
});

test("replacing value with null should not cause infinite update loop", function() {
  expect(4);

  stop();

  source1.transform({
    op: 'add',
    path: ['planet', '123'],
    value: source1.normalize('planet', {name: 'Jupiter'})
  }).then(function() {
    source1.transform({
      op: 'replace',
      path: ['planet', '123', 'name'],
      value: null
    }).then(function() {
      source1.find('planet', '123').then(function(planet1) {
        source2.find('planet', '123').then(function(planet2) {
          start();
          notStrictEqual(planet2, planet1, 'not the same object as the one originally inserted');
          strictEqual(planet2.__id, planet1.__id, 'backup record has the same primary id');
          strictEqual(planet2.name, planet1.name, 'backup record has the same name');
          strictEqual(planet2.name, null, 'records have name == null');
        });
      });
    });
  });
});

test("replacing link should not cause infinite update loop", function() {
  expect(12);

  schema.registerModel('friend', {
    keys: {
      __id: {},
      id: { primaryKey: true, defaultValue: uuid }
    },
    links: {
      group: { model: 'group', type: 'hasOne', inverse: 'members' }
    }
  });

  schema.registerModel('group', {
    keys: {
      __id: {},
      id: { primaryKey: true, defaultValue: uuid }
    },
    links: {
      members: { model: 'friend', type: 'hasMany', inverse: 'group' }
    }
  });

  stop();

  Orbit.Promise
    .all([
      source1.add('friend', {
        id: 'gnarf',
      }),
      source1.add('group', {
        id: 'initial',
      }),
      source1.add('group', {
        id: 'new'
      })
    ])
    .then(function() {
      return source1.addLink('friend', 'gnarf', 'group', 'initial');
    })
    .then(function() {
      equal(source1.retrieveLink('friend', 'gnarf', 'group'), 'initial', 'initial group check');
      equal(source2.retrieveLink('friend', 'gnarf', 'group'), 'initial', 'initial group check');
      equal(source1.retrieveLink('group', 'initial', 'members').length, 1, 'initial group check');
      equal(source2.retrieveLink('group', 'initial', 'members').length, 1, 'initial group check');
      equal(source1.retrieveLink('group', 'new', 'members').length, 0, 'initial group check');
      equal(source2.retrieveLink('group', 'new', 'members').length, 0, 'initial group check');

      // replace the link
      return source1.addLink('friend', 'gnarf', 'group', 'new');
    })
    .then(function() {
      start();
      equal(source1.retrieveLink('friend', 'gnarf', 'group'), 'new', 'new group check');
      equal(source2.retrieveLink('friend', 'gnarf', 'group'), 'new', 'new group check');
      equal(source1.retrieveLink('group', 'initial', 'members').length, 0, 'new group check');
      equal(source2.retrieveLink('group', 'initial', 'members').length, 0, 'new group check');
      equal(source1.retrieveLink('group', 'new', 'members').length, 1, 'new group check');
      equal(source2.retrieveLink('group', 'new', 'members').length, 1, 'new group check');
    });
});

