import { Orbit } from '@orbit/core';
import {
  serializeRecordIdentity,
  deserializeRecordIdentity,
  InitializedRecord,
  RecordIdentity,
  RecordQueryBuilder,
  RecordTransformBuilder
} from '@orbit/records';
import {
  RecordRelationshipIdentity,
  AsyncRecordCache,
  AsyncRecordCacheSettings,
  RecordCacheQueryOptions,
  RecordCacheTransformOptions,
  RecordCacheUpdateDetails,
  RecordTransformBuffer,
  SimpleRecordTransformBuffer
} from '@orbit/record-cache';
import { supportsIndexedDB } from './lib/indexeddb';
import { RequestOptions } from '@orbit/data';

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

export interface IndexedDBCacheSettings<
  QO extends RequestOptions = RecordCacheQueryOptions,
  TO extends RequestOptions = RecordCacheTransformOptions,
  QB = RecordQueryBuilder,
  TB = RecordTransformBuilder
> extends AsyncRecordCacheSettings<QO, TO, QB, TB> {
  namespace?: string;
}

export interface IndexedDBCacheClass<
  QO extends RequestOptions = RecordCacheQueryOptions,
  TO extends RequestOptions = RecordCacheTransformOptions,
  QB = RecordQueryBuilder,
  TB = RecordTransformBuilder,
  QRD = unknown,
  TRD extends RecordCacheUpdateDetails = RecordCacheUpdateDetails
> {
  new (settings: IndexedDBCacheSettings<QO, TO, QB, TB>): IndexedDBCache<
    QO,
    TO,
    QB,
    TB,
    QRD,
    TRD
  >;
}

/**
 * A cache used to access records in an IndexedDB database.
 *
 * Because IndexedDB access is async, this cache extends `AsyncRecordCache`.
 */
export class IndexedDBCache<
  QO extends RequestOptions = RecordCacheQueryOptions,
  TO extends RequestOptions = RecordCacheTransformOptions,
  QB = RecordQueryBuilder,
  TB = RecordTransformBuilder,
  QRD = unknown,
  TRD extends RecordCacheUpdateDetails = RecordCacheUpdateDetails
> extends AsyncRecordCache<QO, TO, QB, TB, QRD, TRD> {
  protected _namespace: string;
  protected _db?: IDBDatabase;
  protected _openingDB?: Promise<IDBDatabase>;

  constructor(settings: IndexedDBCacheSettings<QO, TO, QB, TB>) {
    assert('Your browser does not support IndexedDB!', supportsIndexedDB());

    if (
      Orbit.debug &&
      settings.defaultTransformOptions?.useBuffer === undefined
    ) {
      console.warn(
        'IndexedDBCache will perform much better when it buffers bulk writes to IndexedDB. ' +
          'To enable buffered writes, configure IndexedDBSource or IndexedDBCache with `{ defaultTransformOptions: { useBuffer: true } }`. ' +
          'The only known transforms which are not fully handled by buffered writes are cascading (> 1 level of) dependent deletes. ' +
          '(To hide this warning set `Orbit.debug = false` or set the `useBuffer` default explicitly to `true` or `false`.)'
      );
    }

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

  /**
   * Initializes the contents of the database.
   *
   * Idempotently register models which do not yet have corresponding object
   * stores. Also, creates an object store for tracking inverse relationships,
   * if it is missing.
   *
   * Override this method and/or `registerModel` to provide more advanced
   * db initialization.
   */
  createDB(db: IDBDatabase): void {
    const objectStoreNames = db.objectStoreNames;

    Object.keys(this.schema.models).forEach((model) => {
      if (!objectStoreNames.contains(model)) {
        this.registerModel(db, model);
      }
    });

    if (!objectStoreNames.contains(INVERSE_RELS)) {
      this.createInverseRelationshipStore(db);
    }
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
   * Migrates the database to align with an updated schema.
   *
   * By default, this will attempt a naive migration by invoking `createDB`,
   * which idempotently creates object stores as needed.
   *
   * Override this method to provide more sophisticated migrations.
   */
  migrateDB(db: IDBDatabase, event: IDBVersionChangeEvent): void {
    if (Orbit.debug) {
      console.log(
        `IndexedDBCache#migrateDB - upgrading ${event.oldVersion} -> ${event.newVersion}`
      );
    }

    // Attempt naive migration, creating object stores as needed.
    this.createDB(db);
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

  createTransaction(
    storeNames: string[],
    mode?: IDBTransactionMode
  ): IDBTransaction {
    if (!this._db) throw new Error(DB_NOT_OPEN);

    return this._db.transaction(storeNames, mode);
  }

  registerModel(db: IDBDatabase, type: string): void {
    db.createObjectStore(type, { keyPath: 'id' });

    // TODO - override and create appropriate indices
  }

  clearRecords(type: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.createTransaction([type], 'readwrite');
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

  getRecordAsync(
    record: RecordIdentity
  ): Promise<InitializedRecord | undefined> {
    return new Promise((resolve, reject) => {
      const transaction = this.createTransaction([record.type]);
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
  ): Promise<InitializedRecord[]> {
    if (typeOrIdentities === undefined) {
      return this._getAllRecords();
    } else if (typeof typeOrIdentities === 'string') {
      const type: string = typeOrIdentities;

      return new Promise((resolve, reject) => {
        const transaction = this.createTransaction([type]);
        const objectStore = transaction.objectStore(type);
        const records: InitializedRecord[] = [];
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
      const records: InitializedRecord[] = [];

      if (identities.length > 0) {
        const types: string[] = [];
        for (let identity of identities) {
          if (!types.includes(identity.type)) {
            types.push(identity.type);
          }
        }
        const transaction = this.createTransaction(types);

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

  setRecordAsync(record: InitializedRecord): Promise<void> {
    const transaction = this.createTransaction([record.type], 'readwrite');
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

  setRecordsAsync(records: InitializedRecord[]): Promise<void> {
    if (records.length > 0) {
      const types: string[] = [];
      for (let record of records) {
        if (!types.includes(record.type)) {
          types.push(record.type);
        }
      }
      const transaction = this.createTransaction(types, 'readwrite');

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
  ): Promise<InitializedRecord | undefined> {
    return new Promise((resolve, reject) => {
      const transaction = this.createTransaction(
        [recordIdentity.type],
        'readwrite'
      );
      const objectStore = transaction.objectStore(recordIdentity.type);
      const request = objectStore.delete(recordIdentity.id);

      request.onsuccess = () => resolve(undefined);
      request.onerror = () => reject(request.error);
    });
  }

  removeRecordsAsync(records: RecordIdentity[]): Promise<InitializedRecord[]> {
    if (records.length > 0) {
      const types: string[] = [];
      for (let record of records) {
        if (!types.includes(record.type)) {
          types.push(record.type);
        }
      }
      const transaction = this.createTransaction(types, 'readwrite');

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
    recordIdentityOrIdentities: RecordIdentity | RecordIdentity[]
  ): Promise<RecordRelationshipIdentity[]> {
    // console.log('getInverseRelationshipsAsync', recordIdentityOrIdentities);

    return new Promise((resolve, reject) => {
      const transaction = this.createTransaction([INVERSE_RELS]);
      const objectStore = transaction.objectStore(INVERSE_RELS);
      const results: RecordRelationshipIdentity[] = [];
      let index;
      try {
        index = objectStore.index('relatedIdentity');
      } catch (e) {
        console.error(
          `[@orbit/indexeddb] The 'relatedIdentity' index is missing from the ${INVERSE_RELS} object store in IndexedDB. ` +
            'Please add this index using a DB migration as described in https://github.com/orbitjs/orbit/pull/823'
        );
        resolve([]);
        return;
      }

      const identities: RecordIdentity[] = Array.isArray(
        recordIdentityOrIdentities
      )
        ? recordIdentityOrIdentities
        : [recordIdentityOrIdentities];

      const len = identities.length;
      if (len === 0) {
        resolve([]);
      } else {
        let completed = 0;
        for (let i = 0; i < len; i++) {
          const identity = identities[i];
          const keyRange = Orbit.globals.IDBKeyRange.only(
            serializeRecordIdentity(identity)
          );
          const request = index.openCursor(keyRange);

          request.onsuccess = (event: any) => {
            const cursor = event.target.result;
            if (cursor) {
              let result = this._fromInverseRelationshipForIDB(cursor.value);
              results.push(result);
              cursor.continue();
            } else {
              completed += 1;
              if (completed === len) {
                resolve(results);
              }
            }
          };

          request.onerror = () => reject(request.error);
        }
      }
    });
  }

  addInverseRelationshipsAsync(
    relationships: RecordRelationshipIdentity[]
  ): Promise<void> {
    // console.log('addInverseRelationshipsAsync', relationships);

    if (relationships.length > 0) {
      const transaction = this.createTransaction([INVERSE_RELS], 'readwrite');
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

    if (relationships.length > 0) {
      const transaction = this.createTransaction([INVERSE_RELS], 'readwrite');
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

  /**
   * Override `_getTransformBuffer` on base `AsyncRecordCache` to provide a
   * `transformBuffer` if a custom one hasn't been provided via the constructor
   * setting.
   */
  protected _getTransformBuffer(): RecordTransformBuffer {
    if (this._transformBuffer === undefined) {
      const { schema, keyMap } = this;
      this._transformBuffer = new SimpleRecordTransformBuffer({
        schema,
        keyMap
      });
    }
    return this._transformBuffer;
  }

  protected async _getAllRecords(): Promise<InitializedRecord[]> {
    const types = Object.keys(this.schema.models);

    const recordsets = await Promise.all(
      types.map((type) => this.getRecordsAsync(type))
    );

    const allRecords: InitializedRecord[] = [];
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
