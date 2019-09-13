import Orbit, {
  serializeRecordIdentity,
  deserializeRecordIdentity,
  Record,
  RecordIdentity
} from '@orbit/data';
import {
  RecordRelationshipIdentity,
  AsyncRecordCache,
  AsyncRecordCacheSettings
} from '@orbit/record-cache';
import { supportsIndexedDB } from './lib/indexeddb';

const { assert } = Orbit;

const INVERSE_RELS = '__inverseRels__';

interface InverseRelationshipForIDB {
  id: string;
  recordIdentity: string;
  relationship: string;
  relatedIdentity: string;
  type: string;
  relatedType: string;
}

export interface IndexedDBCacheSettings extends AsyncRecordCacheSettings {
  namespace?: string;
}

/**
 * A cache used to access records in an IndexedDB database.
 *
 * Because IndexedDB access is async, this cache extends `AsyncRecordCache`.
 */
export default class IndexedDBCache extends AsyncRecordCache {
  protected _namespace: string;
  protected _db: IDBDatabase;

  constructor(settings: IndexedDBCacheSettings) {
    assert('Your browser does not support IndexedDB!', supportsIndexedDB());

    super(settings);

    this._namespace = settings.namespace || 'orbit';
  }

  get namespace(): string {
    return this._namespace;
  }

  async upgrade(): Promise<void> {
    await this.reopenDB();
    for (let processor of this._processors) {
      await processor.upgrade();
    }
  }

  async reset(): Promise<void> {
    await this.deleteDB();

    for (let processor of this._processors) {
      await processor.reset();
    }
  }

  /**
   * The version to specify when opening the IndexedDB database.
   */
  get dbVersion(): number {
    return this._schema.version;
  }

  /**
   * IndexedDB database name.
   *
   * Defaults to the namespace of the app, which can be overridden in the constructor.
   */
  get dbName(): string {
    return this._namespace;
  }

  get isDBOpen(): boolean {
    return !!this._db;
  }

  openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this._db) {
        resolve(this._db);
      } else {
        let request = Orbit.globals.indexedDB.open(this.dbName, this.dbVersion);

        request.onerror = (/* event */) => {
          // console.error('error opening indexedDB', this.dbName);
          reject(request.error);
        };

        request.onsuccess = (/* event */) => {
          // console.log('success opening indexedDB', this.dbName);
          const db = (this._db = request.result);
          resolve(db);
        };

        request.onupgradeneeded = (event: any) => {
          // console.log('indexedDB upgrade needed');
          const db = (this._db = event.target.result);
          if (event && event.oldVersion > 0) {
            this.migrateDB(db, event);
          } else {
            this.createDB(db);
          }
        };
      }
    });
  }

  closeDB(): void {
    if (this.isDBOpen) {
      this._db.close();
      this._db = null;
    }
  }

  reopenDB(): Promise<IDBDatabase> {
    this.closeDB();
    return this.openDB();
  }

  createDB(db: IDBDatabase): void {
    // console.log('createDB');
    Object.keys(this.schema.models).forEach(model => {
      this.registerModel(db, model);
    });

    this.createInverseRelationshipStore(db);
  }

  createInverseRelationshipStore(db: IDBDatabase): void {
    let objectStore = db.createObjectStore(INVERSE_RELS, { keyPath: 'id' });
    objectStore.createIndex('recordIdentity', 'recordIdentity', {
      unique: false
    });
  }

  /**
   * Migrate database.
   */
  migrateDB(db: IDBDatabase, event: IDBVersionChangeEvent): void {
    console.error(
      'IndexedDBSource#migrateDB - should be overridden to upgrade IDBDatabase from: ',
      event.oldVersion,
      ' -> ',
      event.newVersion
    );
  }

  deleteDB(): Promise<void> {
    this.closeDB();

    return new Promise((resolve, reject) => {
      let request = Orbit.globals.indexedDB.deleteDatabase(this.dbName);

      request.onerror = (/* event */) => {
        // console.error('error deleting indexedDB', this.dbName);
        reject(request.error);
      };

      request.onsuccess = (/* event */) => {
        // console.log('success deleting indexedDB', this.dbName);
        resolve();
      };
    });
  }

  registerModel(db: IDBDatabase, type: string) {
    // console.log('registerModel', type);
    db.createObjectStore(type, { keyPath: 'id' });
    // TODO - create indices
  }

  clearRecords(type: string): Promise<void> {
    // console.log('clearRecords', type);

    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction([type], 'readwrite');
      const objectStore = transaction.objectStore(type);
      const request = objectStore.clear();

      request.onerror = function(/* event */) {
        // console.error('error - removeRecords', request.error);
        reject(request.error);
      };

      request.onsuccess = function(/* event */) {
        // console.log('success - removeRecords');
        resolve();
      };
    });
  }

  getRecordAsync(record: RecordIdentity): Promise<Record | undefined> {
    // console.log('getRecordAsync', record);

    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction([record.type]);
      const objectStore = transaction.objectStore(record.type);
      const request = objectStore.get(record.id);

      request.onerror = function(/* event */) {
        // console.error('error - getRecord', request.error);
        reject(request.error);
      };

      request.onsuccess = (/* event */) => {
        // console.log('success - getRecord', request.result);
        let result = request.result;

        if (result) {
          if (this._keyMap) {
            this._keyMap.pushRecord(result);
          }
          resolve(result);
        } else {
          resolve(undefined);
        }
      };
    });
  }

  getRecordsAsync(
    typeOrIdentities?: string | RecordIdentity[]
  ): Promise<Record[]> {
    // console.log('getRecordsAsync', typeOrIdentities);

    if (!typeOrIdentities) {
      return this._getAllRecords();
    } else if (typeof typeOrIdentities === 'string') {
      const type: string = typeOrIdentities;

      return new Promise((resolve, reject) => {
        const transaction = this._db.transaction([type]);
        const objectStore = transaction.objectStore(type);
        const request = objectStore.openCursor();
        const records: Record[] = [];

        request.onerror = function(/* event */) {
          // console.error('error - getRecords', request.error);
          reject(request.error);
        };

        request.onsuccess = (event: any) => {
          // TODO: typing
          // console.log('success - getRecords', request.result);
          const cursor = event.target.result;
          if (cursor) {
            let record = cursor.value;

            if (this._keyMap) {
              this._keyMap.pushRecord(record);
            }

            records.push(record);
            cursor.continue();
          } else {
            resolve(records);
          }
        };
      });
    } else if (Array.isArray(typeOrIdentities)) {
      const identities: RecordIdentity[] = typeOrIdentities;
      const records: Record[] = [];

      if (identities.length > 0) {
        const types: string[] = [];
        for (let identity of identities) {
          if (!types.includes(identity.type)) {
            types.push(identity.type);
          }
        }
        const transaction = this._db.transaction(types);

        return new Promise((resolve, reject) => {
          let i = 0;

          let getNext = (): any => {
            if (i < identities.length) {
              let identity = identities[i++];
              let objectStore = transaction.objectStore(identity.type);
              let request = objectStore.get(identity.id);

              request.onsuccess = (/* event */) => {
                // console.log('success - getRecords', request.result);
                let result = request.result;

                if (result) {
                  if (this._keyMap) {
                    this._keyMap.pushRecord(result);
                  }
                  records.push(result);
                }
                getNext();
              };
              request.onerror = function(/* event */) {
                // console.error('error - getRecords', request.error);
                reject(request.error);
              };
            } else {
              resolve(records);
            }
          };

          getNext();
        });
      } else {
        return Promise.resolve(records);
      }
    }
  }

  setRecordAsync(record: Record): Promise<void> {
    const transaction = this._db.transaction([record.type], 'readwrite');
    const objectStore = transaction.objectStore(record.type);

    return new Promise((resolve, reject) => {
      const request = objectStore.put(record);

      request.onerror = function(/* event */) {
        // console.error('error - putRecord', request.error);
        reject(request.error);
      };

      request.onsuccess = (/* event */) => {
        // console.log('success - putRecord');
        if (this._keyMap) {
          this._keyMap.pushRecord(record);
        }

        resolve();
      };
    });
  }

  setRecordsAsync(records: Record[]): Promise<void> {
    if (records.length > 0) {
      const types: string[] = [];
      for (let record of records) {
        if (!types.includes(record.type)) {
          types.push(record.type);
        }
      }
      const transaction = this._db.transaction(types, 'readwrite');

      return new Promise((resolve, reject) => {
        let i = 0;

        let putNext = (): any => {
          if (i < records.length) {
            let record = records[i++];
            let objectStore = transaction.objectStore(record.type);
            let request = objectStore.put(record);
            request.onsuccess = putNext();
            request.onerror = function(/* event */) {
              // console.error('error - setRecordsAsync', request.error);
              reject(request.error);
            };
          } else {
            resolve();
          }
        };

        putNext();
      });
    }
  }

  removeRecordAsync(recordIdentity: RecordIdentity): Promise<Record> {
    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction(
        [recordIdentity.type],
        'readwrite'
      );
      const objectStore = transaction.objectStore(recordIdentity.type);
      const request = objectStore.delete(recordIdentity.id);

      request.onerror = function(/* event */) {
        // console.error('error - removeRecord', request.error);
        reject(request.error);
      };

      request.onsuccess = function(/* event */) {
        // console.log('success - removeRecord');
        resolve();
      };
    });
  }

  removeRecordsAsync(records: RecordIdentity[]): Promise<Record[]> {
    if (records.length > 0) {
      const types: string[] = [];
      for (let record of records) {
        if (!types.includes(record.type)) {
          types.push(record.type);
        }
      }
      const transaction = this._db.transaction(types, 'readwrite');

      return new Promise((resolve, reject) => {
        let i = 0;

        let removeNext = (): any => {
          if (i < records.length) {
            let record = records[i++];
            let objectStore = transaction.objectStore(record.type);
            let request = objectStore.delete(record.id);
            request.onsuccess = removeNext();
            request.onerror = function(/* event */) {
              // console.error('error - addInverseRelationshipsAsync', request.error);
              reject(request.error);
            };
          } else {
            resolve();
          }
        };

        removeNext();
      });
    }
  }

  getInverseRelationshipsAsync(
    recordIdentity: RecordIdentity
  ): Promise<RecordRelationshipIdentity[]> {
    // console.log('getInverseRelationshipsAsync', recordIdentity);

    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction([INVERSE_RELS]);
      const objectStore = transaction.objectStore(INVERSE_RELS);
      const results: RecordRelationshipIdentity[] = [];
      const keyRange = Orbit.globals.IDBKeyRange.only(
        serializeRecordIdentity(recordIdentity)
      );
      const request = objectStore.index('recordIdentity').openCursor(keyRange);

      request.onerror = function(/* event */) {
        // console.error('error - getRecords', request.error);
        reject(request.error);
      };

      request.onsuccess = (event: any) => {
        // console.log('success - getInverseRelationshipsAsync', request.result);
        const cursor = event.target.result;
        if (cursor) {
          let result = this._fromInverseRelationshipForIDB(cursor.value);
          results.push(result);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
    });
  }

  addInverseRelationshipsAsync(
    relationships: RecordRelationshipIdentity[]
  ): Promise<void> {
    // console.log('addInverseRelationshipsAsync', relationships);

    if (relationships.length > 0) {
      const transaction = this._db.transaction([INVERSE_RELS], 'readwrite');
      const objectStore = transaction.objectStore(INVERSE_RELS);

      return new Promise((resolve, reject) => {
        let i = 0;

        let putNext = (): any => {
          if (i < relationships.length) {
            let relationship = relationships[i++];
            let ir = this._toInverseRelationshipForIDB(relationship);
            let request = objectStore.put(ir);
            request.onsuccess = putNext();
            request.onerror = function(/* event */) {
              // console.error('error - addInverseRelationshipsAsync', request.error);
              reject(request.error);
            };
          } else {
            resolve();
          }
        };

        putNext();
      });
    } else {
      return Promise.resolve();
    }
  }

  removeInverseRelationshipsAsync(
    relationships: RecordRelationshipIdentity[]
  ): Promise<void> {
    // console.log('removeInverseRelationshipsAsync', relationships);

    if (relationships.length > 0) {
      const transaction = this._db.transaction([INVERSE_RELS], 'readwrite');
      const objectStore = transaction.objectStore(INVERSE_RELS);

      return new Promise((resolve, reject) => {
        let i = 0;

        let removeNext = (): any => {
          if (i < relationships.length) {
            let relationship = relationships[i++];
            let id = this._serializeInverseRelationshipIdentity(relationship);
            let request = objectStore.delete(id);
            request.onsuccess = removeNext();
            request.onerror = function(/* event */) {
              // console.error('error - removeInverseRelationshipsAsync');
              reject(request.error);
            };
          } else {
            resolve();
          }
        };

        removeNext();
      });
    } else {
      return Promise.resolve();
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // Protected methods
  /////////////////////////////////////////////////////////////////////////////

  protected _getAllRecords(): Promise<Record[]> {
    const allRecords: Record[] = [];

    const objectStoreNames = this._db.objectStoreNames;
    const types: string[] = [];
    for (let i = 0; i < objectStoreNames.length; i++) {
      let type = objectStoreNames.item(i);
      if (type !== INVERSE_RELS) {
        types.push(type);
      }
    }

    return types
      .reduce((chain, type) => {
        return chain.then(() => {
          return this.getRecordsAsync(type).then(records => {
            Array.prototype.push.apply(allRecords, records);
          });
        });
      }, Promise.resolve())
      .then(() => allRecords);
  }

  protected _serializeInverseRelationshipIdentity(
    ri: RecordRelationshipIdentity
  ): string {
    return [
      serializeRecordIdentity(ri.record),
      ri.relationship,
      serializeRecordIdentity(ri.relatedRecord)
    ].join('::');
  }

  protected _toInverseRelationshipForIDB(
    ri: RecordRelationshipIdentity
  ): InverseRelationshipForIDB {
    return {
      id: this._serializeInverseRelationshipIdentity(ri),
      recordIdentity: serializeRecordIdentity(ri.record),
      relationship: ri.relationship,
      relatedIdentity: serializeRecordIdentity(ri.relatedRecord),
      type: ri.record.type,
      relatedType: ri.relatedRecord.type
    };
  }

  protected _fromInverseRelationshipForIDB(
    ir: InverseRelationshipForIDB
  ): RecordRelationshipIdentity {
    return {
      record: deserializeRecordIdentity(ir.recordIdentity),
      relatedRecord: deserializeRecordIdentity(ir.relatedIdentity),
      relationship: ir.relationship
    };
  }
}
