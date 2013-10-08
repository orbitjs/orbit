import Orbit from 'orbit/core';
import RestStore from 'orbit/sources/rest_store';
import RSVP from 'rsvp';

var server,
    store;

///////////////////////////////////////////////////////////////////////////////

module("Unit - RestStore", {
  setup: function() {
    Orbit.Promise = RSVP.Promise;
    Orbit.ajax = window.jQuery.ajax;

    // fake xhr
    server = window.sinon.fakeServer.create();
    server.autoRespond = true;

    store = new RestStore();
  },

  teardown: function() {
    store = null;

    server.restore();
  }
});

test("it exists", function() {
  ok(store);
});

test("it can insert records", function() {
  expect(5);

  server.respondWith('POST', '/planets', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {name: 'Jupiter', classification: 'gas giant'}, 'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Jupiter', classification: 'gas giant'}));
  });

  stop();
  store.insertRecord('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    start();
    ok(planet.__id, 'orbit id should be defined');
    equal(planet.id, 12345, 'server id should be defined');
    equal(planet.name, 'Jupiter', 'name should match');
    equal(planet.classification, 'gas giant', 'classification should match');
  });
});

test("it can update records", function() {
  expect(5);

  server.respondWith('PUT', '/planets/12345', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {id: 12345, name: 'Jupiter', classification: 'gas giant'}, 'PUT request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Jupiter', classification: 'gas giant'}));
  });

  stop();
  store.updateRecord('planet', {id: 12345, name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    start();
    ok(planet.__id, 'orbit id should be defined');
    equal(planet.id, 12345, 'server id should be defined');
    equal(planet.name, 'Jupiter', 'name should match');
    equal(planet.classification, 'gas giant', 'classification should match');
  });
});

test("it can patch records", function() {
  expect(5);

  server.respondWith('PATCH', '/planets/12345', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {classification: 'gas giant'}, 'PATCH request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Jupiter', classification: 'gas giant'}));
  });

  stop();
  store.patchRecord('planet', {id: 12345, classification: 'gas giant'}).then(function(planet) {
    start();
    ok(planet.__id, 'orbit id should be defined');
    equal(planet.id, 12345, 'server id should be defined');
    equal(planet.name, 'Jupiter', 'name should match');
    equal(planet.classification, 'gas giant', 'classification should match');
  });
});

test("it can delete records", function() {
  expect(2);

  server.respondWith('DELETE', '/planets/12345', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), null, 'DELETE request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({}));
  });

  stop();
  store.destroyRecord('planet', {id: 12345}).then(function() {
    start();
    ok(true, 'record deleted');
  });
});

test("it can find individual records", function() {
  expect(6);

  server.respondWith('POST', '/planets', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {name: 'Jupiter', classification: 'gas giant'}, 'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Jupiter', classification: 'gas giant'}));
  });

  server.respondWith('GET', '/planets/12345', function(xhr) {
    ok(true, 'GET request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Jupiter', classification: 'gas giant'}));
  });

  stop();
  store.insertRecord('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    store.find('planet', planet.__id).then(function(planet) {
      start();
      ok(planet.__id, 'orbit id should be defined');
      equal(planet.id, 12345, 'server id should be defined');
      equal(planet.name, 'Jupiter', 'name should match');
      equal(planet.classification, 'gas giant', 'classification should match');
    });
  });
});

// TODO
//test("it can find all records", function() {
//  expect(1);
//
//  var response = [
//    {id: 12345, name: 'Jupiter', classification: 'gas giant'},
//    {id: 12346, name: 'Earth', classification: 'terrestrial'}
//  ];
//
//  server.respondWith('GET', '/planets', function(xhr) {
//    xhr.respond(200,
//                {'Content-Type': 'application/json'},
//                JSON.stringify(response));
//  });
//
//  stop();
//  store.find('planet').then(function(planets) {
//    start();
//    deepEqual(planets, response, 'data matches response');
//  });
//});
