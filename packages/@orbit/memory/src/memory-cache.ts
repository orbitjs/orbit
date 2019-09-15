/* eslint-disable valid-jsdoc */
import Orbit, { fromEvent } from '@orbit/core';
import { clone, Dict, map, filter, pipe } from '@orbit/utils';
import {
  Record,
  RecordIdentity,
  equalRecordIdentities,
  QueryOrExpressions,
  RecordOperation,
  buildQuery
} from '@orbit/data';
import {
  RecordRelationshipIdentity,
  SyncRecordCache,
  SyncRecordCacheSettings,
  QueryResult
} from '@orbit/record-cache';
import { ImmutableMap } from '@orbit/immutable';

const { deprecate } = Orbit;

export interface MemoryCacheSettings extends SyncRecordCacheSettings {
  base?: MemoryCache;
}

/**
 * A cache used to access records in memory.
 *
 * Because data is stored in immutable maps, this type of cache can be forked
 * efficiently.
 */
export default class MemoryCache extends SyncRecordCache {
  protected _records: Dict<ImmutableMap<string, Record>>;
  protected _inverseRelationships: Dict<
    ImmutableMap<string, RecordRelationshipIdentity[]>
  >;

  constructor(settings: MemoryCacheSettings) {
    super(settings);

    this.reset(settings.base);
  }

  observeQuery(
    queryOrExpressions: QueryOrExpressions,
    options?: object,
    id?: string
  ): AsyncIterable<QueryResult> {
    const query = buildQuery(
      queryOrExpressions,
      options,
      id,
      this.queryBuilder
    );
    const types = (query.expressions as any[])
      .map(({ type }) => type)
      .filter(type => type);
    const filterByType = filter<RecordOperation | undefined>(
      operation => !operation || types.indexOf(operation.record.type) !== -1
    );
    const executeQuery = map<RecordOperation | undefined, QueryResult>(() =>
      this.query(query)
    );

    return {
      [Symbol.asyncIterator]() {
        const operations = fromEvent<RecordOperation | undefined>(this, ['patch', 'reset']);
        return pipe(
          filterByType,
          executeQuery
        )(operations);
      }
    };
  }

  getRecordSync(identity: RecordIdentity): Record | undefined {
    return this._records[identity.type].get(identity.id);
  }

  records(type: string) {
    deprecate(
      '`records(type).get(id)` is deprecated, use `getRecordSync(identity)`.'
    );
    return {
      get: (id: string) => {
        return this.getRecordSync({ type, id });
      }
    };
  }

  getRecordsSync(typeOrIdentities?: string | RecordIdentity[]): Record[] {
    if (Array.isArray(typeOrIdentities)) {
      const records: Record[] = [];
      const identities: RecordIdentity[] = typeOrIdentities;
      for (let identity of identities) {
        let record: Record = this.getRecordSync(identity);
        if (record) {
          records.push(record);
        }
      }
      return records;
    } else {
      const type: string = typeOrIdentities;

      return Array.from(this._records[type].values());
    }
  }

  setRecordSync(record: Record): void {
    this._records[record.type].set(record.id, record);
  }

  setRecordsSync(records: Record[]): void {
    let typedMap: any = {};
    for (let record of records) {
      typedMap[record.type] = typedMap[record.type] || [];
      typedMap[record.type].push([record.id, record]);
    }
    for (let type in typedMap) {
      this._records[type].setMany(typedMap[type]);
    }
  }

  removeRecordSync(recordIdentity: RecordIdentity): Record {
    const recordMap = this._records[recordIdentity.type];
    const record = recordMap.get(recordIdentity.id);
    if (record) {
      recordMap.remove(recordIdentity.id);
      return record;
    } else {
      return null;
    }
  }

  removeRecordsSync(recordIdentities: RecordIdentity[]): Record[] {
    const records = [];
    const typedIds: any = {};
    for (let recordIdentity of recordIdentities) {
      let record = this.getRecordSync(recordIdentity);
      if (record) {
        records.push(record);
        typedIds[record.type] = typedIds[record.type] || [];
        typedIds[record.type].push(recordIdentity.id);
      }
    }
    for (let type in typedIds) {
      this._records[type].removeMany(typedIds[type]);
    }
    return records;
  }

  getInverseRelationshipsSync(
    recordIdentity: RecordIdentity
  ): RecordRelationshipIdentity[] {
    return (
      this._inverseRelationships[recordIdentity.type].get(recordIdentity.id) ||
      []
    );
  }

  addInverseRelationshipsSync(
    relationships: RecordRelationshipIdentity[]
  ): void {
    relationships.forEach(r => {
      let rels = this._inverseRelationships[r.relatedRecord.type].get(
        r.relatedRecord.id
      );
      rels = rels ? clone(rels) : [];
      rels.push(r);
      this._inverseRelationships[r.relatedRecord.type].set(
        r.relatedRecord.id,
        rels
      );
    });
  }

  removeInverseRelationshipsSync(
    relationships: RecordRelationshipIdentity[]
  ): void {
    relationships.forEach(r => {
      let rels = this._inverseRelationships[r.relatedRecord.type].get(
        r.relatedRecord.id
      );
      if (rels) {
        let newRels = rels.filter(
          rel =>
            !(
              equalRecordIdentities(rel.record, r.record) &&
              rel.relationship === r.relationship
            )
        );
        this._inverseRelationships[r.relatedRecord.type].set(
          r.relatedRecord.id,
          newRels
        );
      }
    });
  }

  /**
   * Resets the cache's state to be either empty or to match the state of
   * another cache.
   *
   * @example
   * ``` javascript
   * cache.reset(); // empties cache
   * cache.reset(cache2); // clones the state of cache2
   * ```
   */
  reset(base?: MemoryCache): void {
    this._records = {};

    Object.keys(this._schema.models).forEach(type => {
      let baseRecords = base && base._records[type];

      this._records[type] = new ImmutableMap<string, Record>(baseRecords);
    });

    this._resetInverseRelationships(base);

    this._processors.forEach(processor => processor.reset(base));

    this.emit('reset');
  }

  /**
   * Upgrade the cache based on the current state of the schema.
   */
  upgrade() {
    Object.keys(this._schema.models).forEach(type => {
      if (!this._records[type]) {
        this._records[type] = new ImmutableMap<string, Record>();
      }
    });

    this._resetInverseRelationships();
    this._processors.forEach(processor => processor.upgrade());
  }

  /////////////////////////////////////////////////////////////////////////////
  // Protected methods
  /////////////////////////////////////////////////////////////////////////////

  protected _resetInverseRelationships(base?: MemoryCache) {
    const inverseRelationships: Dict<
      ImmutableMap<string, RecordRelationshipIdentity[]>
    > = {};
    Object.keys(this._schema.models).forEach(type => {
      let baseRelationships = base && base._inverseRelationships[type];
      inverseRelationships[type] = new ImmutableMap(baseRelationships);
    });
    this._inverseRelationships = inverseRelationships;
  }
}
