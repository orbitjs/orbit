// import Orbit from 'orbit/main';
// import { uuid } from 'orbit/lib/uuid';
// import Schema from 'orbit-common/schema';
// import Source from 'orbit-common/source';
// import JSONAPISource from 'orbit-common/jsonapi-source';
// import JSONAPIPatchSource from 'orbit-common/jsonapi-patch-source';
// import { Promise } from 'rsvp';
// import jQuery from 'jquery';
//
// var server,
//     schema,
//     source;
//
// ///////////////////////////////////////////////////////////////////////////////
//
// module("OC - JSONAPIPatchSource", {
//   setup: function() {
//     Orbit.Promise = Promise;
//     Orbit.ajax = jQuery.ajax;
//
//     // fake xhr
//     server = sinon.fakeServer.create();
//     server.autoRespond = true;
//
//     schema = new Schema({
//       modelDefaults: {
//         keys: {
//           '__id': {primaryKey: true, defaultValue: uuid},
//           'id': {}
//         }
//       },
//       models: {
//         planet: {
//           attributes: {
//             name: {type: 'string'},
//             classification: {type: 'string'}
//           },
//           links: {
//             moons: {type: 'hasMany', model: 'moon', inverse: 'planet'}
//           }
//         },
//         moon: {
//           attributes: {
//             name: {type: 'string'}
//           },
//           links: {
//             planet: {type: 'hasOne', model: 'planet', inverse: 'moons'}
//           }
//         }
//       }
//     });
//
//     source = new JSONAPIPatchSource(schema);
//   },
//
//   teardown: function() {
//     schema = null;
//     source = null;
//
//     server.restore();
//   }
// });
//
// test("it exists", function() {
//   ok(source);
// });
//
// test("its prototype chain is correct", function() {
//   ok(source instanceof Source, 'instanceof Source');
//   ok(source instanceof JSONAPISource, 'instanceof JSONAPISource');
// });
//
// test("#add - can insert records", function() {
//   expect(5);
//
//   server.respondWith('PATCH', '/planets', function(xhr) {
//     deepEqual(JSON.parse(xhr.requestBody), [{op: 'add', path: '/-', value: {name: 'Jupiter', classification: 'gas giant', links: {moons: []}}}], 'PATCH request');
//     xhr.respond(201,
//                 {'Content-Type': 'application/json'},
//                 JSON.stringify([{planets: {id: '12345', name: 'Jupiter', classification: 'gas giant'}}]));
//   });
//
//   stop();
//   source.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
//     start();
//     ok(planet.__id, 'orbit id should be defined');
//     equal(planet.id, 12345, 'server id should be defined');
//     equal(planet.name, 'Jupiter', 'name should match');
//     equal(planet.classification, 'gas giant', 'classification should match');
//   });
// });
//
// test("#update - can update records", function() {
//   expect(5);
//
//   server.respondWith('PATCH', '/planets/12345', function(xhr) {
//     deepEqual(JSON.parse(xhr.requestBody), [{op: 'replace', path: '/', value: {id: '12345', name: 'Jupiter', classification: 'gas giant', links: {moons: []}}}], 'PATCH request');
//     xhr.respond(200,
//                 {'Content-Type': 'application/json'},
//                 JSON.stringify({}));
//   });
//
//   stop();
//   var data = {id: '12345', name: 'Jupiter', classification: 'gas giant'};
//   source.update('planet', data).then(function() {
//     start();
//     var planetId = source.getId('planet', data);
//     var planet = source.retrieve(['planet', planetId]);
//     equal(planet.__id, planetId, 'orbit id should be defined');
//     equal(planet.id, '12345', 'server id should be defined');
//     equal(planet.name, 'Jupiter', 'name should match');
//     equal(planet.classification, 'gas giant', 'classification should match');
//   });
// });
//
// test("#patch - can patch records", function() {
//   expect(2);
//
//   server.respondWith('PATCH', '/planets/12345', function(xhr) {
//     deepEqual(JSON.parse(xhr.requestBody), [{op: 'replace', path: '/classification', value: 'gas giant'}], 'PATCH request');
//     xhr.respond(200,
//                 {'Content-Type': 'application/json'},
//                 JSON.stringify({}));
//   });
//
//   stop();
//   source.patch('planet', {id: 12345}, 'classification', 'gas giant').then(function() {
//     start();
//     ok(true, 'record patched');
//   });
// });
//
// test("#remove - can delete records", function() {
//   expect(2);
//
//   server.respondWith('PATCH', '/planets/12345', function(xhr) {
//     deepEqual(JSON.parse(xhr.requestBody), [{op: 'remove', path: '/'}],
//               'PATCH request to remove record');
//     xhr.respond(200,
//                 {'Content-Type': 'application/json'},
//                 JSON.stringify({}));
//   });
//
//   stop();
//   source.remove('planet', {id: '12345'}).then(function() {
//     start();
//     ok(true, 'record deleted');
//   });
// });
//
// test("#addLink - can add a hasMany relationship", function() {
//   expect(2);
//
//   server.respondWith('PATCH', '/planets/12345/links/moons', function(xhr) {
//     deepEqual(JSON.parse(xhr.requestBody), [{op: 'add', path: '/-', value: '987'}],
//               'PATCH request to add link to primary record');
//     xhr.respond(200,
//                 {'Content-Type': 'application/json'},
//                 JSON.stringify({}));
//   });
//
//   stop();
//   source.addLink('planet', {id: '12345'}, 'moons', {id: '987'}).then(function() {
//     start();
//     ok(true, 'records linked');
//   });
// });
//
// test("#removeLink - can remove a relationship", function() {
//   expect(2);
//
//   server.respondWith('PATCH', '/planets/12345/links/moons', function(xhr) {
//     deepEqual(JSON.parse(xhr.requestBody), [{op: 'remove', path: '/987'}],
//               'PATCH request to remove link from primary record');
//     xhr.respond(200,
//                 {'Content-Type': 'application/json'},
//                 JSON.stringify({}));
//   });
//
//   stop();
//   source.removeLink('planet', {id: 12345}, 'moons', {id: 987}).then(function() {
//     start();
//     ok(true, 'records unlinked');
//   });
// });
//
// test("#updateLink - can replace a hasOne relationship", function() {
//   expect(2);
//
//   server.respondWith('PATCH', '/moons/987/links/planet', function(xhr) {
//     deepEqual(JSON.parse(xhr.requestBody), [{op: 'replace', path: '/', value: '12345'}],
//               'PATCH request to replace link');
//     xhr.respond(200,
//                 {'Content-Type': 'application/json'},
//                 JSON.stringify({}));
//   });
//
//   stop();
//   source.updateLink('moon', {id: '987'}, 'planet', {id: '12345'}).then(function() {
//     start();
//     ok(true, 'records linked');
//   });
// });
//
// test("#updateLink - can replace a hasMany relationship (flagged as `actsAsSet`)", function() {
//   expect(2);
//
//   // Moons link must be flagged with `actsAsSet`
//   source.schema.models.planet.links.moons.actsAsSet = true;
//
//   server.respondWith('PATCH', '/planets/12345/links/moons', function(xhr) {
//     deepEqual(JSON.parse(xhr.requestBody), [{op: 'replace', path: '/', value: ['987']}],
//       'PATCH request to replace link');
//     xhr.respond(200,
//       {'Content-Type': 'application/json'},
//       JSON.stringify({}));
//   });
//
//   stop();
//   source.updateLink('planet', {id: '12345'}, 'moons', [{id: '987'}]).then(function() {
//     start();
//     ok(true, 'records linked');
//   });
// });
