import Orbit from 'orbit/core';
import RestStore from 'orbit/sources/rest_store';
import RSVP from 'rsvp';

var server;
var dogs;

///////////////////////////////////////////////////////////////////////////////

module("Unit - RestStore", {
  setup: function() {
    Orbit.Promise = RSVP.Promise;
    Orbit.ajax = window.jQuery.ajax;

    // fake xhr
    server = window.sinon.fakeServer.create();
    server.autoRespond = true;

    dogs = new RestStore();
    dogs.namespace = 'dogs';
  },

  teardown: function() {
    dogs = null;

    server.restore();
  }
});

test("it exists", function() {
  ok(dogs);
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
  dogs.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
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
  dogs.updateRecord({id: 12345, name: 'Hubert', gender: 'm'}).then(function(dog) {
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
  dogs.patchRecord({id: 12345, gender: 'm'}).then(function(dog) {
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
  dogs.destroyRecord({id: 12345}).then(function() {
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
  dogs.find(12345).then(function(dog) {
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
  dogs.find().then(function(dogs) {
    start();
    deepEqual(dogs, response, 'data matches response');
  });
});
