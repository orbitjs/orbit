import Orbit, {
  Bucket, BucketSettings
} from '@orbit/core';
import { assert } from '@orbit/utils';
import { supportsIndexedDB } from './lib/indexeddb';

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
export default class IndexedDBBucket extends Bucket {
  protected _storeName: string;
  protected _db: any;

  /**
   * Create a new IndexedDBBucket.
   *
   * @constructor
   * @param {Object}  [settings = {}]
   * @param {String}  [settings.name]        Optional. Name of this bucket.
   * @param {String}  [settings.namespace]   Optional. Namespace of the bucket. Will be used for the IndexedDB database name. Defaults to 'orbit-bucket'.
   * @param {String}  [settings.storeName]   Optional. Name of the IndexedDB ObjectStore. Defaults to 'data'.
   * @param {Integer} [settings.version]     Optional. The version to open the IndexedDB database with. Defaults to `1`.
   */
  constructor(settings: IndexedDBBucketSettings = {}) {
    assert('Your browser does not support IndexedDB!', supportsIndexedDB());

    settings.name = settings.name || 'indexedDB';
    settings.storeName = settings.storeName || 'data';

    super(settings);
  }

  upgrade(settings: IndexedDBBucketSettings) {
    this.closeDB();
    return super.upgrade(settings)
      .then(() => this.openDB());
  }

  _applySettings(settings: IndexedDBBucketSettings) {
    this._storeName = settings.storeName;
    return super._applySettings(settings);
  }

  /**
   * The version to specify when opening the IndexedDB database.
   *
   * IndexedDB's default verions is 1.
   *
   * @return {Integer} Version number.
   */
  get dbVersion() {
    return this.version;
  }

  /**
   * IndexedDB database name.
   *
   * Defaults to 'orbit-bucket', which can be overridden in the constructor.
   *
   * @return {String} Database name.
   */
  get dbName() {
    return this.namespace;
  }

  /**
   * IndexedDB ObjectStore name.
   *
   * Defaults to 'settings', which can be overridden in the constructor.
   *
   * @return {String} Database name.
   */
  get dbStoreName() {
    return this._storeName;
  }

  get isDBOpen() {
    return !!this._db;
  }

  openDB() {
    return new Orbit.Promise((resolve, reject) => {
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
          const db = this._db = request.result;
          resolve(db);
        };

        request.onupgradeneeded = (event) => {
          // console.log('indexedDB upgrade needed');
          const db = this._db = event.target.result;
          if (event && event.oldVersion > 0) {
            this.migrateDB(db, event);
          } else {
            this.createDB(db);
          }
        };
      }
    });
  }

  closeDB() {
    if (this.isDBOpen) {
      this._db.close();
      this._db = null;
    }
  }

  reopenDB() {
    this.closeDB();
    return this.openDB();
  }

  createDB(db) {
    db.createObjectStore(this.dbStoreName); //, { keyPath: 'key' });
  }

  /**
   * Migrate database.
   *
   * @param  {IDBDatabase} db              Database to upgrade.
   * @param  {IDBVersionChangeEvent} event Event resulting from version change.
   */
  migrateDB(db, event) {
    console.error('IndexedDBBucket#migrateDB - should be overridden to upgrade IDBDatabase from: ', event.oldVersion, ' -> ', event.newVersion);
  }

  deleteDB() {
    this.closeDB();

    return new Orbit.Promise((resolve, reject) => {
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
    return this.openDB()
      .then(() => {
        return new Orbit.Promise((resolve, reject) => {
          const transaction = this._db.transaction([this.dbStoreName]);
          const objectStore = transaction.objectStore(this.dbStoreName);
          const request = objectStore.get(key);

          request.onerror = function(/* event */) {
            console.error('error - getItem', request.error);
            reject(request.error);
          };

          request.onsuccess = function(/* event */) {
            // console.log('success - getItem', request.result);
            resolve(request.result);
          };
        });
      });
  }

  setItem(key: string, value: any): Promise<void> {
    return this.openDB()
      .then(() => {
        const transaction = this._db.transaction([this.dbStoreName], 'readwrite');
        const objectStore = transaction.objectStore(this.dbStoreName);

        return new Orbit.Promise((resolve, reject) => {
          const request = objectStore.put(value, key);

          request.onerror = function(/* event */) {
            console.error('error - setItem', request.error);
            reject(request.error);
          };

          request.onsuccess = function(/* event */) {
            // console.log('success - setItem');
            resolve();
          };
        });
      });
  }

  removeItem(key: string): Promise<void> {
    return this.openDB()
      .then(() => {
        return new Orbit.Promise((resolve, reject) => {
          const transaction = this._db.transaction([this.dbStoreName], 'readwrite');
          const objectStore = transaction.objectStore(this.dbStoreName);
          const request = objectStore.delete(key);

          request.onerror = function(/* event */) {
            console.error('error - removeItem', request.error);
            reject(request.error);
          };

          request.onsuccess = function(/* event */) {
            // console.log('success - removeItem');
            resolve();
          };
        });
      });
  }
}
