// import Orbit from 'orbit/main';
// import { uuid } from 'orbit/lib/uuid';
// import Schema from 'orbit-common/schema';
// import MemorySource from 'orbit-common/memory-source';
// import JSONAPISource from 'orbit-common/jsonapi-source';
// import TransformConnector from 'orbit/transform-connector';
// import { Promise } from 'rsvp';
// import jQuery from 'jquery';
//
// var server,
//     memorySource,
//     restSource,
//     memToRestConnector;
//
// module("Integration - Rest / Memory (Non-Blocking) rollbackTransformsOnFailure=true", {
//   setup: function() {
//     Orbit.Promise = Promise;
//     Orbit.ajax = jQuery.ajax;
//
//     // Fake xhr
//     server = sinon.fakeServer.create();
//
//     // Create schema
//     var schema = new Schema({
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
//           }
//         }
//       }
//     });
//
//     // Create sources
//     memorySource = new MemorySource(schema);
//     restSource = new JSONAPISource(schema);
//
//     memorySource.id = 'memorySource';
//     restSource.id = 'restSource';
//
//     // Connect MemorySource <-> JSONAPISource
//     memToRestConnector = new TransformConnector(memorySource, restSource, {
//       blocking: false,
//       rollbackTransformsOnFailure: true
//     });
//   },
//
//   teardown: function() {
//     memToRestConnector = null;
//     memorySource = restSource = null;
//
//     // Restore xhr
//     server.restore();
//   }
// });
//
// test("records inserted into memory should be deleted when rest fails", function() {
//   expect(2);
//
//   stop();
//   memorySource.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function() {
//     equal(memorySource.length('planet'), 1,    'memory source should contain one record');
//   }).then(function() {
//     return new Orbit.Promise(function(resolve) {
//       server.respond('POST', '/planets', function(xhr) {
//         xhr.respond(418, {'Content-Type': 'application/json'}, JSON.stringify({}));
//         resolve();
//       });
//     });
//   }).then(function() {
//     setTimeout(function() {
//       equal(memorySource.length('planet'), 0, 'memory source should contain no records');
//       start();
//     }, 0);
//   });
// });
//
// test("records patched in memory should be unpatched when rest fails", function() {
//   expect(2);
//
//   stop();
//   var record;
//   memorySource.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(newRecord) {
//     record = newRecord;
//     equal(record.name, 'Jupiter', 'memory source - inserted - name - Jupiter');
//
//     server.respond('POST', '/planets', function(xhr) {
//       xhr.respond(201,
//                   {'Content-Type': 'application/json'},
//                   JSON.stringify({planets: {id: '12345', name: 'Jupiter', classification: 'gas giant'}}));
//     });
//
//     return memorySource.patch('planet', record.__id, 'name', 'Earth');
//   }).then(function() {
//     return new Orbit.Promise(function(resolve) {
//       server.respond('PUT', '/planets/12345', function(xhr) {
//         xhr.respond(418, {'Content-Type': 'application/json'}, JSON.stringify({}));
//         resolve();
//       });
//     });
//   }).then(function() {
//     setTimeout(function() {
//       var savedRecord = memorySource.retrieve(['planet', record.__id]);
//       equal(savedRecord.name, 'Jupiter', 'memory source - patched - name - hasn\'t changed');
//       start();
//     }, 0);
//   });
// });
//
// test("records deleted in memory should be inserted when rest fails", function() {
//   expect(1);
//
//   stop();
//   var record;
//   memorySource.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(newRecord) {
//     record = newRecord;
//     server.respond('POST', '/planets', function(xhr) {
//       xhr.respond(201,
//                   {'Content-Type': 'application/json'},
//                   JSON.stringify({planets: {id: '12345', name: 'Jupiter', classification: 'gas giant'}}));
//     });
//
//     return memorySource.remove('planet', record.__id);
//   }).then(function() {
//     return new Orbit.Promise(function(resolve) {
//       server.respond('DELETE', '/planets/12345', function(xhr) {
//         xhr.respond(418,
//                     {'Content-Type': 'application/json'},
//                     JSON.stringify({}));
//         resolve();
//       });
//     });
//   }).then(function() {
//     setTimeout(function() {
//       var savedRecord = memorySource.retrieve(['planet', record.__id]);
//       ok(savedRecord, 'record was inserted');
//       start();
//     }, 0);
//   });
// });
//
// module("Integration - Rest / Memory (Non-Blocking) rollbackTransformsOnFailure=false", {
//   setup: function() {
//     Orbit.Promise = Promise;
//     Orbit.ajax = jQuery.ajax;
//
//     // Fake xhr
//     server = sinon.fakeServer.create();
//
//     // Create schema
//     var schema = new Schema({
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
//           }
//         }
//       }
//     });
//
//     // Create sources
//     memorySource = new MemorySource(schema);
//     restSource = new JSONAPISource(schema);
//
//     memorySource.id = 'memorySource';
//     restSource.id = 'restSource';
//
//     // Connect MemorySource <-> JSONAPISource
//     memToRestConnector = new TransformConnector(memorySource, restSource, {
//       blocking: false,
//       rollbackTransformsOnFailure: false
//     });
//   },
//
//   teardown: function() {
//     memToRestConnector = null;
//     memorySource = restSource = null;
//
//     // Restore xhr
//     server.restore();
//   }
// });
//
// test("records inserted into memory should not be deleted when rest fails", function() {
//   expect(2);
//
//   stop();
//   memorySource.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function() {
//     equal(memorySource.length('planet'), 1,    'memory source should contain one record');
//   }).then(function() {
//     return new Orbit.Promise(function(resolve) {
//       server.respond('POST', '/planets', function(xhr) {
//         xhr.respond(418, {'Content-Type': 'application/json'}, JSON.stringify({}));
//         resolve();
//       });
//     });
//   }).then(function() {
//     setTimeout(function() {
//       equal(memorySource.length('planet'), 1, 'memory source should contain 1 record');
//       start();
//     }, 0);
//   });
// });
//
// test("records patched in memory should not be unpatched when rest fails", function() {
//   expect(2);
//
//   stop();
//   var record;
//   memorySource.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(newRecord) {
//     record = newRecord;
//     equal(record.name, 'Jupiter', 'memory source - inserted - name - Jupiter');
//
//     server.respond('POST', '/planets', function(xhr) {
//       xhr.respond(201,
//                   {'Content-Type': 'application/json'},
//                   JSON.stringify({planets: {id: '12345', name: 'Jupiter', classification: 'gas giant'}}));
//     });
//
//     return memorySource.patch('planet', record.__id, 'name', 'Earth');
//   }).then(function() {
//     return new Orbit.Promise(function(resolve) {
//       server.respond('PUT', '/planets/12345', function(xhr) {
//         xhr.respond(418, {'Content-Type': 'application/json'}, JSON.stringify({}));
//         resolve();
//       });
//     });
//   }).then(function() {
//     setTimeout(function() {
//       var savedRecord = memorySource.retrieve(['planet', record.__id]);
//       equal(savedRecord.name, 'Earth', 'memory source - patched - name - Earth');
//       start();
//     }, 0);
//   });
// });
//
// test("records deleted in memory not should be inserted when rest fails", function() {
//   expect(1);
//
//   stop();
//   var record;
//   memorySource.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(newRecord) {
//     record = newRecord;
//     server.respond('POST', '/planets', function(xhr) {
//       xhr.respond(201,
//                   {'Content-Type': 'application/json'},
//                   JSON.stringify({planets: {id: '12345', name: 'Jupiter', classification: 'gas giant'}}));
//     });
//
//     return memorySource.remove('planet', record.__id);
//   }).then(function() {
//     return new Orbit.Promise(function(resolve) {
//       server.respond('DELETE', '/planets/12345', function(xhr) {
//         xhr.respond(418,
//                     {'Content-Type': 'application/json'},
//                     JSON.stringify({}));
//         resolve();
//       });
//     });
//   }).then(function() {
//     setTimeout(function() {
//       var savedRecord = memorySource.retrieve(['planet', record.__id]);
//       ok(!savedRecord, 'record was not inserted');
//       start();
//     }, 0);
//   });
// });
