import { Orbit } from '@orbit/core';
import {
  serializeRecordIdentity,
  deserializeRecordIdentity,
  Record,
  RecordIdentity
} from '@orbit/records';
import {
  RecordRelationshipIdentity,
  AsyncRecordCache,
  AsyncRecordCacheSettings
} from '@orbit/record-cache';
import { supportsIndexedDB } from './lib/indexeddb';

const { assert } = Orbit;

const INVERSE_RELS = '__inverseRels__';
const DB_NOT_OPEN = 'IndexedDB database is not yet open';

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
export class IndexedDBCache extends AsyncRecordCache {
  protected _namespace: string;
  protected _db?: IDBDatabase;
  protected _openingDB?: Promise<IDBDatabase>;

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
    return (this._openingDB = new Promise((resolve, reject) => {
      if (this._db) {
        resolve(this._db);
      } else {
        let request = Orbit.globals.indexedDB.open(this.dbName, this.dbVersion);

        request.onsuccess = () => {
          const db = (this._db = request.result);
          resolve(db);
        };

        request.onerror = () => {
          reject(request.error);
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
    }));
  }

  async closeDB(): Promise<void> {
    if (this.isDBOpen) {
      // Finish opening DB before closing it to avoid problems
      if (this._openingDB) {
        await this._openingDB;
        this._openingDB = undefined;
      }
      if (this._db) {
        this._db.close();
        this._db = undefined;
      }
    }
  }

  async reopenDB(): Promise<IDBDatabase> {
    await this.closeDB();
    return this.openDB();
  }

  createDB(db: IDBDatabase): void {
    Object.keys(this.schema.models).forEach((model) => {
      this.registerModel(db, model);
    });

    this.createInverseRelationshipStore(db);
  }

  createInverseRelationshipStore(db: IDBDatabase): void {
    let objectStore = db.createObjectStore(INVERSE_RELS, { keyPath: 'id' });
    objectStore.createIndex('recordIdentity', 'recordIdentity', {
      unique: false
    });
    objectStore.createIndex('relatedIdentity', 'relatedIdentity', {
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

  async deleteDB(): Promise<void> {
    await this.closeDB();

    return new Promise((resolve, reject) => {
      let request = Orbit.globals.indexedDB.deleteDatabase(this.dbName);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  registerModel(db: IDBDatabase, type: string): void {
    db.createObjectStore(type, { keyPath: 'id' });

    // TODO - override and create appropriate indices
  }

  clearRecords(type: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this._db) return reject(DB_NOT_OPEN);

      const transaction = this._db.transaction([type], 'readwrite');
      const objectStore = transaction.objectStore(type);
      const request = objectStore.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  getRecordAsync(record: RecordIdentity): Promise<Record | undefined> {
    return new Promise((resolve, reject) => {
      if (!this._db) return reject(DB_NOT_OPEN);

      const transaction = this._db.transaction([record.type]);
      const objectStore = transaction.objectStore(record.type);
      const request = objectStore.get(record.id);

      request.onsuccess = () => {
        let result = request.result;
        if (result) {
          if (this._keyMap) this._keyMap.pushRecord(result);
          resolve(result);
        } else {
          resolve(undefined);
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  getRecordsAsync(
    typeOrIdentities?: string | RecordIdentity[]
  ): Promise<Record[]> {
    if (!this._db) return Promise.reject(DB_NOT_OPEN);

    if (!typeOrIdentities) {
      return this._getAllRecords();
    } else if (typeof typeOrIdentities === 'string') {
      const type: string = typeOrIdentities;

      return new Promise((resolve, reject) => {
        if (!this._db) return reject(DB_NOT_OPEN);

        const records: Record[] = [];
        const transaction = this._db.transaction([type]);
        const objectStore = transaction.objectStore(type);
        const request = objectStore.openCursor();

        request.onsuccess = (event: any) => {
          const cursor = event.target.result;
          if (cursor) {
            let record = cursor.value;
            if (this._keyMap) this._keyMap.pushRecord(record);
            records.push(record);
            cursor.continue();
          } else {
            resolve(records);
          }
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } else {
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
          const len = identities.length;
          const last = len - 1;
          for (let i = 0; i < len; i++) {
            const identity = identities[i];
            const objectStore = transaction.objectStore(identity.type);
            const request = objectStore.get(identity.id);

            request.onsuccess = () => {
              const record = request.result;
              if (record) {
                if (this._keyMap) this._keyMap.pushRecord(record);
                records.push(record);
              }
              if (i === last) resolve(records);
            };

            request.onerror = () => reject(request.error);
          }
        });
      } else {
        return Promise.resolve(records);
      }
    }
  }

  setRecordAsync(record: Record): Promise<void> {
    if (!this._db) return Promise.reject(DB_NOT_OPEN);

    const transaction = this._db.transaction([record.type], 'readwrite');
    const objectStore = transaction.objectStore(record.type);

    return new Promise((resolve, reject) => {
      const request = objectStore.put(record);

      request.onsuccess = () => {
        if (this._keyMap) this._keyMap.pushRecord(record);
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  setRecordsAsync(records: Record[]): Promise<void> {
    if (!this._db) return Promise.reject(DB_NOT_OPEN);

    if (records.length > 0) {
      const types: string[] = [];
      for (let record of records) {
        if (!types.includes(record.type)) {
          types.push(record.type);
        }
      }
      const transaction = this._db.transaction(types, 'readwrite');

      return new Promise((resolve, reject) => {
        const len = records.length;
        const last = len - 1;
        for (let i = 0; i < len; i++) {
          const record = records[i];
          const objectStore = transaction.objectStore(record.type);
          const request = objectStore.put(record);

          if (i === last) {
            request.onsuccess = () => {
              if (this._keyMap) {
                records.forEach((record) => this._keyMap?.pushRecord(record));
              }
              resolve();
            };
          }

          request.onerror = () => reject(request.error);
        }
      });
    } else {
      return Promise.resolve();
    }
  }

  removeRecordAsync(
    recordIdentity: RecordIdentity
  ): Promise<Record | undefined> {
    return new Promise((resolve, reject) => {
      if (!this._db) return reject(DB_NOT_OPEN);

      const transaction = this._db.transaction(
        [recordIdentity.type],
        'readwrite'
      );
      const objectStore = transaction.objectStore(recordIdentity.type);
      const request = objectStore.delete(recordIdentity.id);

      request.onsuccess = () => resolve(undefined);
      request.onerror = () => reject(request.error);
    });
  }

  removeRecordsAsync(records: RecordIdentity[]): Promise<Record[]> {
    if (!this._db) return Promise.reject(DB_NOT_OPEN);

    if (records.length > 0) {
      const types: string[] = [];
      for (let record of records) {
        if (!types.includes(record.type)) {
          types.push(record.type);
        }
      }
      const transaction = this._db.transaction(types, 'readwrite');

      return new Promise((resolve, reject) => {
        const len = records.length;
        const last = len - 1;
        for (let i = 0; i < len; i++) {
          const record = records[i];
          const objectStore = transaction.objectStore(record.type);
          const request = objectStore.delete(record.id);

          if (i === last) {
            request.onsuccess = () => resolve(records);
          }
          request.onerror = () => reject(request.error);
        }
      });
    } else {
      return Promise.resolve([]);
    }
  }

  getInverseRelationshipsAsync(
    recordIdentity: RecordIdentity
  ): Promise<RecordRelationshipIdentity[]> {
    // console.log('getInverseRelationshipsAsync', recordIdentity);

    return new Promise((resolve, reject) => {
      if (!this._db) return reject(DB_NOT_OPEN);

      const transaction = this._db.transaction([INVERSE_RELS]);
      const objectStore = transaction.objectStore(INVERSE_RELS);
      const results: RecordRelationshipIdentity[] = [];
      const keyRange = Orbit.globals.IDBKeyRange.only(
        serializeRecordIdentity(recordIdentity)
      );
      const request = objectStore.index('relatedIdentity').openCursor(keyRange);

      request.onsuccess = (event: any) => {
        const cursor = event.target.result;
        if (cursor) {
          let result = this._fromInverseRelationshipForIDB(cursor.value);
          results.push(result);
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  addInverseRelationshipsAsync(
    relationships: RecordRelationshipIdentity[]
  ): Promise<void> {
    // console.log('addInverseRelationshipsAsync', relationships);
    if (!this._db) return Promise.reject(DB_NOT_OPEN);

    if (relationships.length > 0) {
      const transaction = this._db.transaction([INVERSE_RELS], 'readwrite');
      const objectStore = transaction.objectStore(INVERSE_RELS);

      return new Promise((resolve, reject) => {
        const len = relationships.length;
        const last = len - 1;
        for (let i = 0; i < len; i++) {
          const relationship = relationships[i];
          const ir = this._toInverseRelationshipForIDB(relationship);
          const request = objectStore.put(ir);

          if (i === last) {
            request.onsuccess = () => resolve();
          }
          request.onerror = () => reject(request.error);
        }
      });
    } else {
      return Promise.resolve();
    }
  }

  removeInverseRelationshipsAsync(
    relationships: RecordRelationshipIdentity[]
  ): Promise<void> {
    // console.log('removeInverseRelationshipsAsync', relationships);
    if (!this._db) return Promise.reject(DB_NOT_OPEN);

    if (relationships.length > 0) {
      const transaction = this._db.transaction([INVERSE_RELS], 'readwrite');
      const objectStore = transaction.objectStore(INVERSE_RELS);

      return new Promise((resolve, reject) => {
        const len = relationships.length;
        const last = len - 1;
        for (let i = 0; i < len; i++) {
          const relationship = relationships[i];
          const id = this._serializeInverseRelationshipIdentity(relationship);
          const request = objectStore.delete(id);

          if (i === last) {
            request.onsuccess = () => resolve();
          }
          request.onerror = () => reject(request.error);
        }
      });
    } else {
      return Promise.resolve();
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // Protected methods
  /////////////////////////////////////////////////////////////////////////////

  protected async _getAllRecords(): Promise<Record[]> {
    if (!this._db) return Promise.reject(DB_NOT_OPEN);

    const types = Object.keys(this.schema.models);

    const recordsets = await Promise.all(
      types.map((type) => this.getRecordsAsync(type))
    );

    const allRecords: Record[] = [];
    recordsets.forEach((records) =>
      Array.prototype.push.apply(allRecords, records)
    );

    return allRecords;
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
