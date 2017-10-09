import Orbit, {
  pullable, Pullable,
  pushable, Pushable,
  Resettable,
  syncable, Syncable,
  Query,
  QueryOrExpression,
  Record, RecordIdentity,
  Source, SourceSettings,
  Transform,
  TransformOrOperations,
  RecordNotFoundException
} from '@orbit/data';
import { assert } from '@orbit/utils';
import transformOperators from './lib/transform-operators';
import { PullOperator, PullOperators } from './lib/pull-operators';
import { supportsIndexedDB } from './lib/indexeddb';

declare const console: any;

export interface IndexedDBSourceSettings extends SourceSettings {
  namespace?: string;
}

/**
 * Source for storing data in IndexedDB.
 *
 * @class IndexedDBSource
 * @extends Source
 */
@pullable
@pushable
@syncable
export default class IndexedDBSource extends Source implements Pullable, Pushable, Resettable, Syncable {
  protected _namespace: string;
  protected _db: any;

  // Syncable interface stubs
  sync: (transformOrTransforms: Transform | Transform[]) => Promise<void>;

  // Pullable interface stubs
  pull: (queryOrExpression: QueryOrExpression, options?: object, id?: string) => Promise<Transform[]>;

  // Pushable interface stubs
  push: (transformOrOperations: TransformOrOperations, options?: object, id?: string) => Promise<Transform[]>;

  /**
   * Create a new IndexedDBSource.
   *
   * @constructor
   * @param {Object}  [settings = {}]
   * @param {Schema}  [settings.schema]    Orbit Schema.
   * @param {String}  [settings.name]      Optional. Name for source. Defaults to 'indexedDB'.
   * @param {String}  [settings.namespace] Optional. Namespace of the application. Will be used for the IndexedDB database name. Defaults to 'orbit'.
   */
  constructor(settings: IndexedDBSourceSettings = {}) {
    assert('IndexedDBSource\'s `schema` must be specified in `settings.schema` constructor argument', !!settings.schema);
    assert('Your browser does not support IndexedDB!', supportsIndexedDB());

    settings.name = settings.name || 'indexedDB';

    super(settings);

    this._namespace = settings.namespace || 'orbit';
  }

  upgrade(): Promise<void> {
    return this.reopenDB();
  }

  /**
   * The version to specify when opening the IndexedDB database.
   *
   * @return {Integer} Version number.
   */
  get dbVersion(): number {
    return this._schema.version;
  }

  /**
   * IndexedDB database name.
   *
   * Defaults to the namespace of the app, which can be overridden in the constructor.
   *
   * @return {String} Database name.
   */
  get dbName(): string {
    return this._namespace;
  }

  get isDBOpen(): boolean {
    return !!this._db;
  }

  openDB(): Promise<any> {
    return new Orbit.Promise((resolve, reject) => {
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

  closeDB(): void {
    if (this.isDBOpen) {
      this._db.close();
      this._db = null;
    }
  }

  reopenDB(): Promise<any> {
    this.closeDB();
    return this.openDB();
  }

  createDB(db): void {
    // console.log('createDB');
    Object.keys(this.schema.models).forEach(model => {
      this.registerModel(db, model);
    });
  }

  /**
   * Migrate database.
   *
   * @param  {IDBDatabase} db              Database to upgrade.
   * @param  {IDBVersionChangeEvent} event Event resulting from version change.
   */
  migrateDB(db, event) {
    console.error('IndexedDBSource#migrateDB - should be overridden to upgrade IDBDatabase from: ', event.oldVersion, ' -> ', event.newVersion);
  }

  deleteDB(): Promise<void> {
    this.closeDB();

    return new Orbit.Promise((resolve, reject) => {
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

  registerModel(db, model) {
    // console.log('registerModel', model);
    db.createObjectStore(model, { keyPath: 'id' });
    // TODO - create indices
  }

  getRecord(record): Promise<Record> {
    return new Orbit.Promise((resolve, reject) => {
      const transaction = this._db.transaction([record.type]);
      const objectStore = transaction.objectStore(record.type);
      const request = objectStore.get(record.id);

      request.onerror = function(/* event */) {
        console.error('error - getRecord', request.error);
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
          reject(new RecordNotFoundException(record.type, record.id));
        }
      };
    });
  }

  getRecords(type: string): Promise<Record[]> {
    return new Orbit.Promise((resolve, reject) => {
      const transaction = this._db.transaction([type]);
      const objectStore = transaction.objectStore(type);
      const request = objectStore.openCursor();
      const records = [];

      request.onerror = function(/* event */) {
        console.error('error - getRecords', request.error);
        reject(request.error);
      };

      request.onsuccess = (event) => {
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
  }

  get availableTypes(): string[] {
    const objectStoreNames = this._db.objectStoreNames;
    const types: string[] = [];

    for (let i = 0; i < objectStoreNames.length; i++) {
      types.push(objectStoreNames.item(i));
    }

    return types;
  }

  putRecord(record: Record): Promise<void> {
    const transaction = this._db.transaction([record.type], 'readwrite');
    const objectStore = transaction.objectStore(record.type);

    return new Orbit.Promise((resolve, reject) => {
      const request = objectStore.put(record);

      request.onerror = function(/* event */) {
        console.error('error - putRecord', request.error);
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

  removeRecord(record: Record): Promise<void> {
    return new Orbit.Promise((resolve, reject) => {
      const transaction = this._db.transaction([record.type], 'readwrite');
      const objectStore = transaction.objectStore(record.type);
      const request = objectStore.delete(record.id);

      request.onerror = function(/* event */) {
        console.error('error - removeRecord', request.error);
        reject(request.error);
      };

      request.onsuccess = function(/* event */) {
        // console.log('success - removeRecord');
        resolve();
      };
    });
  }

  clearRecords(type: string): Promise<void> {
    if (!this._db) {
      return Orbit.Promise.resolve();
    }

    return new Orbit.Promise((resolve, reject) => {
      const transaction = this._db.transaction([type], 'readwrite');
      const objectStore = transaction.objectStore(type);
      const request = objectStore.clear();

      request.onerror = function(/* event */) {
        console.error('error - removeRecords', request.error);
        reject(request.error);
      };

      request.onsuccess = function(/* event */) {
        // console.log('success - removeRecords');
        resolve();
      };
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // Resettable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  reset(): Promise<void> {
    return this.deleteDB();
  }

  /////////////////////////////////////////////////////////////////////////////
  // Syncable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _sync(transform: Transform): Promise<void> {
    return this._processTransform(transform);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pushable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _push(transform: Transform): Promise<Transform[]> {
    return this._processTransform(transform)
      .then(() => [transform]);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pullable implementation
  /////////////////////////////////////////////////////////////////////////////

  _pull(query: Query): Promise<Transform[]> {
    const operator: PullOperator = PullOperators[query.expression.op];
    if (!operator) {
      throw new Error('IndexedDBSource does not support the `${query.expression.op}` operator for queries.');
    }

    return this.openDB()
      .then(() => operator(this, query.expression));
  }

  /////////////////////////////////////////////////////////////////////////////
  // Private
  /////////////////////////////////////////////////////////////////////////////

  _processTransform(transform: Transform): Promise<void> {
    return this.openDB()
      .then(() => {
        let result = Orbit.Promise.resolve();

        transform.operations.forEach(operation => {
          let processor = transformOperators[operation.op];
          result = result.then(() => processor(this, operation));
        });

        return result;
      });
  }
}
