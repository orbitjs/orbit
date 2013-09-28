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
    store.namespace = 'dogs';
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

  server.respondWith('POST', '/dogs', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {name: 'Hubert', gender: 'm'}, 'POST request');
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Hubert', gender: 'm'}));
  });

  stop();
  store.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    start();
    ok(dog.__id, 'orbit id should be defined');
    equal(dog.id, 12345, 'server id should be defined');
    equal(dog.name, 'Hubert', 'name should match');
    equal(dog.gender, 'm', 'gender should match');
  });
});

test("it can update records", function() {
  expect(5);

  server.respondWith('PUT', '/dogs/12345', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {id: 12345, name: 'Hubert', gender: 'm'}, 'PUT request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Hubert', gender: 'm'}));
  });

  stop();
  store.updateRecord({id: 12345, name: 'Hubert', gender: 'm'}).then(function(dog) {
    start();
    ok(dog.__id, 'orbit id should be defined');
    equal(dog.id, 12345, 'server id should be defined');
    equal(dog.name, 'Hubert', 'name should match');
    equal(dog.gender, 'm', 'gender should match');
  });
});

test("it can patch records", function() {
  expect(5);

  server.respondWith('PATCH', '/dogs/12345', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), {gender: 'm'}, 'PATCH request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Hubert', gender: 'm'}));
  });

  stop();
  store.patchRecord({id: 12345, gender: 'm'}).then(function(dog) {
    start();
    ok(dog.__id, 'orbit id should be defined');
    equal(dog.id, 12345, 'server id should be defined');
    equal(dog.name, 'Hubert', 'name should match');
    equal(dog.gender, 'm', 'gender should match');
  });
});

test("it can delete records", function() {
  expect(2);

  server.respondWith('DELETE', '/dogs/12345', function(xhr) {
    deepEqual(JSON.parse(xhr.requestBody), null, 'DELETE request');
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({}));
  });

  stop();
  store.destroyRecord({id: 12345}).then(function() {
    start();
    ok(true, 'record deleted');
  });
});

test("it can find individual records", function() {
  expect(1);

  var response = {id: 12345, name: 'Hubert', gender: 'm'};

  server.respondWith('GET', '/dogs/12345', function(xhr) {
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify(response));
  });

  stop();
  store.find(12345).then(function(dog) {
    start();
    deepEqual(dog, response, 'data matches response');
  });
});

test("it can find all records", function() {
  expect(1);

  var response = [
    {id: 12345, name: 'Hubert', gender: 'm'},
    {id: 12346, name: 'Beatrice', gender: 'f'}
  ];

  server.respondWith('GET', '/dogs', function(xhr) {
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify(response));
  });

  stop();
  store.find().then(function(dogs) {
    start();
    deepEqual(dogs, response, 'data matches response');
  });
});
