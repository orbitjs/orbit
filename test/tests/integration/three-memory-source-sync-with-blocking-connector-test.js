// import 'tests/test-helper';
// import Orbit from 'orbit/main';
// import { uuid } from 'orbit/lib/uuid';
// import Schema from 'orbit-common/schema';
// import MemorySource from 'orbit-common/memory-source';
// import TransformConnector from 'orbit/transform-connector';
// import Transform from 'orbit/transform';
// import { Promise } from 'rsvp';
// import {
//   addRecordOperation,
//   replaceAttributeOperation
// } from 'orbit-common/lib/operations';
// import 'tests/test-helper';
//
// /**
//  This test suite connects three memory sources with synchronous blocking
//  bi-directional transform connectors.
//
//  This configuration should not be used when more than one source can
//  spontaneously mutate, out of the context of responding to another source's
//  mutations. For example, socket sources receive data spontaneously. Having
//  more than one in this configuration could create a deadlock in a central
//  source that is receiving data from both and sending it on to the other.
//  In such a scenario, it would be preferable to use non-blocking connectors to
//  prevent deadlocks.
//  */
// let source1,
//     source2,
//     source3,
//     source1to2Connector,
//     source2to1Connector,
//     source1to3Connector,
//     source3to1Connector;
//
// module('Integration - Three Memory Source Sync (Blocking)', {
//   setup: function() {
//     // Create schema
//     let schema = new Schema({
//       models: {
//         planet: {
//           attributes: {
//             name: { type: 'string' },
//             classification: { type: 'string' }
//           }
//         }
//       }
//     });
//
//     // Create sources
//     source1 = new MemorySource({ schema: schema });
//     source2 = new MemorySource({ schema: schema });
//     source3 = new MemorySource({ schema: schema });
//
//     source1.id = 'source1';
//     source2.id = 'source2';
//     source3.id = 'source3';
//
//     // Create connectors
//     source1to2Connector = new TransformConnector(source1, source2);
//     source2to1Connector = new TransformConnector(source2, source1);
//     source1to3Connector = new TransformConnector(source1, source3);
//     source3to1Connector = new TransformConnector(source3, source1);
//   },
//
//   teardown: function() {
//     source1to2Connector = source2to1Connector = null;
//     source1 = source2 = source3 = null;
//   }
// });
//
// test('consecutive transforms can be applied to one source and should be automatically applied to the other source', function({ async }) {
//   let done = async();
//   expect(4);
//
//   source1.transform(addRecordOperation({ type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter' } }))
//     .then(() => {
//       let record = source1.cache.get(['planet', 'jupiter']);
//       return source1.transform(replaceAttributeOperation(record, 'name', 'Earth'));
//     })
//     .then(() => {
//       let store1Planet = source1.cache.get(['planet', 'jupiter']);
//       let store2Planet = source2.cache.get(['planet', 'jupiter']);
//
//       notStrictEqual(store2Planet, store1Planet, 'not the same object as the one originally inserted');
//       equal(store2Planet.id, store1Planet.id, 'backup record has the same primary id');
//       equal(store2Planet.attributes.name, store1Planet.attributes.name, 'backup record has the same name');
//       equal(store2Planet.attributes.name, 'Earth', 'records have the updated name');
//
//       done();
//     });
// });
//
// test('an array of transforms can be applied to one source and should be automatically applied to the other source', function({ async }) {
//   let done = async();
//   expect(6);
//
//   source1.transform(new Transform([
//     addRecordOperation({ type: 'planet', id: '123', attributes: { name: 'Jupiter' } }),
//     addRecordOperation({ type: 'planet', id: '456', attributes: { name: 'Pluto' } })
//   ]))
//   .then(() => {
//     let primaryJupiter = source1.cache.get(['planet', '123']);
//     let primaryPluto = source1.cache.get(['planet', '456']);
//
//     let backupJupiter = source2.cache.get(['planet', '123']);
//     let backupPluto = source2.cache.get(['planet', '456']);
//
//     notStrictEqual(primaryJupiter, backupJupiter, 'each source has it\'s own copy of Jupiter');
//     notStrictEqual(primaryPluto, backupPluto, 'each source has it\'s own copy of Pluto');
//
//     equal(backupJupiter.id, primaryJupiter.id, 'backup Jupiter has the same primary id');
//     equal(backupJupiter.attributes.name, primaryJupiter.attributes.name, 'backup Jupiter has the same primary name');
//
//     equal(backupPluto.id, primaryPluto.id, 'backup Pluto has the same primary id');
//     equal(backupPluto.attributes.name, primaryPluto.attributes.name, 'backup Pluto has the same primary name');
//
//     done();
//   });
// });
//
// test('replacing value with null should not cause infinite update loop', function({ async }) {
//   let done = async();
//   expect(4);
//
//   source1.transform(addRecordOperation({ type: 'planet', id: '123', attributes: { name: 'Jupiter' } }))
//     .then(() => {
//       return source1.transform(replaceAttributeOperation({ type: 'planet', id: '123' }, 'name', null));
//     })
//     .then(function() {
//       let source1Planet = source1.cache.get(['planet', '123']);
//       let source2Planet = source2.cache.get(['planet', '123']);
//
//       notStrictEqual(source2Planet, source1Planet, 'not the same object as the one originally inserted');
//       strictEqual(source2Planet.id, source1Planet.id, 'backup record has the same primary id');
//       strictEqual(source2Planet.attributes.name, source1Planet.attributes.name, 'backup record has the same name');
//       strictEqual(source2Planet.attributes.name, null, 'records have name == null');
//
//       done();
//     });
// });
