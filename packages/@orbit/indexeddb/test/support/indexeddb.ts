import { IndexedDBCache } from '../../src/index';
import { Record } from '@orbit/data';

export async function getRecordFromIndexedDB(cache: IndexedDBCache, record: Record): Promise<Record> {
  const db = await cache.openDB();
  const transaction = db.transaction([record.type]);
  const objectStore = transaction.objectStore(record.type);

  return new Promise((resolve: (record: Record) => void, reject) => {
    const request = objectStore.get(record.id);

    request.onerror = function(/* event */) {
      console.error('error - getRecord', request.error);
      reject(request.error);
    };

    request.onsuccess = function(/* event */) {
      // console.log('success - getRecord', request.result);
      resolve(request.result as Record);
    };
  });
}
