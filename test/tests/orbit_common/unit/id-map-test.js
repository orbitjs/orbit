import IdMap from 'orbit-common/id-map';

///////////////////////////////////////////////////////////////////////////////

module("OC - IdMap", {
});

test("it exists", function() {
  var idMap = new IdMap('localId', 'remoteId');
  ok(idMap);
});

test("it requires an `idField` and a `remoteIdField`", function() {
  var idMap;

  try {
    idMap = new IdMap();
  } catch(e) {
    ok(e, 'assertion for missing idField');
  }

  try {
    idMap = new IdMap('localId');
  } catch(e) {
    ok(e, 'assertion for missing remoteIdField');
  }
});

test("#register - local and remote ids can be mapped by type", function() {
  var idMap = new IdMap('localId', 'remoteId');

  idMap.register('planet', '1', 'a');
  idMap.register('planet', '2', 'b');
  idMap.register('moon', '1', 'c');
  idMap.register('moon', '2', 'a');

  equal(idMap.remoteToLocalId('moon', 'c'), '1');
  equal(idMap.remoteToLocalId('planet', 'a'), '1');
  equal(idMap.remoteToLocalId('bogus', 'a'), undefined);
  equal(idMap.remoteToLocalId('planet', 'bogus'), undefined);

  equal(idMap.localToRemoteId('planet', '2'), 'b');
  equal(idMap.localToRemoteId('moon', '2'), 'a');
  equal(idMap.localToRemoteId('bogus', '2'), undefined);
  equal(idMap.localToRemoteId('planet', 'bogus'), undefined);
});

test("#registerAll - local and remote ids can be mapped with a data blob", function() {
  var idMap = new IdMap('localId', 'remoteId');

  idMap.registerAll({
    planet: {
      '1': {localId: '1', remoteId: 'a'},
      '2': {localId: '2', remoteId: 'b'}
    },
    moon: {
      '1': {localId: '1', remoteId: 'c'},
      '2': {localId: '2', remoteId: 'a'}
    }
  });

  equal(idMap.remoteToLocalId('moon', 'c'), '1');
  equal(idMap.remoteToLocalId('planet', 'a'), '1');
  equal(idMap.remoteToLocalId('bogus', 'a'), undefined);
  equal(idMap.remoteToLocalId('planet', 'bogus'), undefined);

  equal(idMap.localToRemoteId('planet', '2'), 'b');
  equal(idMap.localToRemoteId('moon', '2'), 'a');
  equal(idMap.localToRemoteId('bogus', '2'), undefined);
  equal(idMap.localToRemoteId('planet', 'bogus'), undefined);
});