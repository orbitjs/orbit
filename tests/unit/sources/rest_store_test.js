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
  expect(3);

  server.respondWith('POST', '/dogs', function(xhr) {
    xhr.respond(201,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Hubert', gender: 'm'}));
  });

  stop();
  dogs.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    start();
    equal(dog.id, 12345, 'id should be defined');
    equal(dog.name, 'Hubert', 'name should match');
    equal(dog.gender, 'm', 'gender should match');
    return dog;
  });
});

test("it can find individual records", function() {
  expect(3);

  server.respondWith('GET', '/dogs/12345', function(xhr) {
    xhr.respond(200,
                {'Content-Type': 'application/json'},
                JSON.stringify({id: 12345, name: 'Hubert', gender: 'm'}));
  });

  stop();
  dogs.find(12345).then(function(dog) {
    start();
    equal(dog.id, 12345, 'id should be defined');
    equal(dog.name, 'Hubert', 'name should match');
    equal(dog.gender, 'm', 'gender should match');
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
    deepEqual(dogs, response);
  });
});
