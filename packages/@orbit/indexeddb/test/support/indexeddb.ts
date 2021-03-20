import { IndexedDBCache } from '../../src/index';
import { InitializedRecord } from '@orbit/records';

export async function getRecordFromIndexedDB(
  cache: IndexedDBCache,
  record: InitializedRecord
): Promise<InitializedRecord> {
  const db = await cache.openDB();
  const transaction = db.transaction([record.type]);
  const objectStore = transaction.objectStore(record.type);

  return new Promise((resolve: (record: InitializedRecord) => void, reject) => {
    const request = objectStore.get(record.id);

    request.onerror = function (/* event */) {
      console.error('error - getRecord', request.error);
      reject(request.error);
    };

    request.onsuccess = function (/* event */) {
      // console.log('success - getRecord', request.result);
      resolve(request.result as InitializedRecord);
    };
  });
}
