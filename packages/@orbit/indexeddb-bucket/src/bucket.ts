import { Orbit, Bucket, BucketSettings } from '@orbit/core';
import { supportsIndexedDB } from './lib/indexeddb';

const { assert } = Orbit;

declare const console: any;

export interface IndexedDBBucketSettings extends BucketSettings {
  storeName?: string;
}

/**
 * Bucket for persisting transient data in IndexedDB.
 *
 * @class IndexedDBBucket
 * @extends Bucket
 */
export class IndexedDBBucket extends Bucket {
  protected _storeName!: string;
  protected _db: any;

  /**
   * Create a new IndexedDBBucket.
   */
  constructor(settings: IndexedDBBucketSettings = {}) {
    assert('Your browser does not support IndexedDB!', supportsIndexedDB());

    settings.name = settings.name || 'indexedDB';
    settings.storeName = settings.storeName || 'data';

    super(settings);
  }

  async upgrade(settings: IndexedDBBucketSettings): Promise<void> {
    this.closeDB();
    await super.upgrade(settings);
    await this.openDB();
  }

  async _applySettings(settings: IndexedDBBucketSettings): Promise<void> {
    if (settings.storeName) {
      this._storeName = settings.storeName;
    }
    await super._applySettings(settings);
  }

  /**
   * The version to specify when opening the IndexedDB database.
   *
   * IndexedDB's default verions is 1.
   */
  get dbVersion(): number {
    return this.version;
  }

  /**
   * IndexedDB database name.
   *
   * Defaults to 'orbit-bucket', which can be overridden in the constructor.
   */
  get dbName(): string {
    return this.namespace;
  }

  /**
   * IndexedDB ObjectStore name.
   *
   * Defaults to 'settings', which can be overridden in the constructor.
   */
  get dbStoreName(): string {
    return this._storeName;
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
          console.error('error opening indexedDB', this.dbName);
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
    db.createObjectStore(this.dbStoreName); //, { keyPath: 'key' });
  }

  /**
   * Migrate database.
   */
  migrateDB(db: IDBDatabase, event: IDBVersionChangeEvent): void {
    console.error(
      'IndexedDBBucket#migrateDB - should be overridden to upgrade IDBDatabase from: ',
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
        console.error('error deleting indexedDB', this.dbName);
        reject(request.error);
      };

      request.onsuccess = (/* event */) => {
        // console.log('success deleting indexedDB', this.dbName);
        this._db = null;
        resolve();
      };
    });
  }

  getItem(key: string): Promise<any> {
    return this.openDB().then(() => {
      return new Promise((resolve, reject) => {
        const transaction = this._db.transaction([this.dbStoreName]);
        const objectStore = transaction.objectStore(this.dbStoreName);
        const request = objectStore.get(key);

        request.onerror = function (/* event */) {
          console.error('error - getItem', request.error);
          reject(request.error);
        };

        request.onsuccess = function (/* event */) {
          // console.log('success - getItem', request.result);
          resolve(request.result);
        };
      });
    });
  }

  async setItem(key: string, value: unknown): Promise<void> {
    await this.openDB();

    const transaction = this._db.transaction([this.dbStoreName], 'readwrite');
    const objectStore = transaction.objectStore(this.dbStoreName);

    await new Promise((resolve, reject) => {
      const request = objectStore.put(value, key);

      request.onerror = function (/* event */) {
        console.error('error - setItem', request.error);
        reject(request.error);
      };

      request.onsuccess = function (/* event */) {
        // console.log('success - setItem');
        resolve(undefined);
      };
    });
  }

  async removeItem(key: string): Promise<void> {
    await this.openDB();
    await new Promise((resolve, reject) => {
      const transaction = this._db.transaction([this.dbStoreName], 'readwrite');
      const objectStore = transaction.objectStore(this.dbStoreName);
      const request = objectStore.delete(key);

      request.onerror = function (/* event */) {
        console.error('error - removeItem', request.error);
        reject(request.error);
      };

      request.onsuccess = function (/* event */) {
        // console.log('success - removeItem');
        resolve(undefined);
      };
    });
  }

  async clear(): Promise<void> {
    await this.openDB();
    await new Promise((resolve, reject) => {
      const transaction = this._db.transaction([this.dbStoreName], 'readwrite');
      const objectStore = transaction.objectStore(this.dbStoreName);
      const request = objectStore.clear();

      request.onerror = function (/* event */) {
        console.error('error - clear', request.error);
        reject(request.error);
      };

      request.onsuccess = function (/* event */) {
        // console.log('success - clear');
        resolve(undefined);
      };
    });
  }
}
