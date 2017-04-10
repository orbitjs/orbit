import Orbit from '@orbit/data';

function getRecord(source, record) {
  return source.openDB()
    .then(db => {
      const transaction = db.transaction([record.type]);
      const objectStore = transaction.objectStore(record.type);

      return new Orbit.Promise((resolve, reject) => {
        const request = objectStore.get(record.id);

        request.onerror = function(/* event */) {
          // console.error('error - getRecord', request.error);
          reject(request.error);
        };

        request.onsuccess = function(/* event */) {
          // console.log('success - getRecord', request.result);
          resolve(request.result);
        };
      });
    });
}

export function verifyIndexedDBContainsRecord(assert, source, record, ignoreFields?) {
  return getRecord(source, record)
    .then(actual => {
      if (ignoreFields) {
        for (let i = 0, l = ignoreFields.length, field; i < l; i++) {
          field = ignoreFields[i];
          actual[record.id][field] = record[field];
        }
      }

      assert.deepEqual(actual, record, 'indexedDB contains record');
    });
}

export function verifyIndexedDBDoesNotContainRecord(assert, source, record) {
  return getRecord(source, record)
    .then(actual => {
      assert.equal(actual, null, 'indexedDB does not contain record');
    });
}
