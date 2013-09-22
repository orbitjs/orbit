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
  expect(1);

  var response = {id: 12345, name: 'Hubert', gender: 'm'};

  server.respondWith('POST', '/dogs', function(xhr) {
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify(response));
  });

  stop();
  store.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    start();
    deepEqual(dog, response, 'data matches response');
  });
});

test("it can update records", function() {
  expect(1);

  var response = {id: 12345, name: 'Hubert', gender: 'm'};

  server.respondWith('PUT', '/dogs/12345', function(xhr) {
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify(response));
  });

  stop();
  store.updateRecord({id: 12345, name: 'Hubert', gender: 'm'}).then(function(dog) {
    start();
    deepEqual(dog, response, 'data matches response');
  });
});

test("it can patch records", function() {
  expect(1);

  var response = {id: 12345, name: 'Hubert', gender: 'm'};

  server.respondWith('PATCH', '/dogs/12345', function(xhr) {
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify(response));
  });

  stop();
  store.patchRecord({id: 12345, gender: 'm'}).then(function(dog) {
    start();
    deepEqual(dog, response, 'data matches response');
  });
});

test("it can delete records", function() {
  expect(1);

  server.respondWith('DELETE', '/dogs/12345', function(xhr) {
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
