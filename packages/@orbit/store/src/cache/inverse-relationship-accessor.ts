import { Dict, isArray, isObject, clone, deepGet } from '@orbit/utils';
import {
  cloneRecordIdentity,
  Record,
  RecordIdentity
} from '@orbit/data';
import Cache from '../cache';
import { ImmutableMap } from '@orbit/immutable';

export interface InverseRelationship {
  record: RecordIdentity,
  relationship: string
}

export default class InverseRelationshipAccessor {
  protected _cache: Cache;
  protected _relationships: Dict<ImmutableMap<string, InverseRelationship[]>>;

  constructor(cache: Cache, base?: InverseRelationshipAccessor) {
    this._cache = cache;
    this.reset(base);
  }

  reset(base?: InverseRelationshipAccessor) {
    let relationships = {};
    if (base) {
      Object.keys(base._relationships).forEach(type => {
        relationships[type] = base._relationships;
      });
    } else {
      Object.keys(this._cache.schema.models).forEach(type => {
        relationships[type] = new ImmutableMap();
      });
    }
    this._relationships = relationships;
  }

  all(record: RecordIdentity): InverseRelationship[] {
    return this._relationships[record.type].get(record.id) || [];
  }

  recordAdded(record: Record) {
    const relationships = record.relationships;
    const recordIdentity = cloneRecordIdentity(record);
    if (relationships) {
      Object.keys(relationships).forEach(relationship => {
        const relationshipData = relationships[relationship] && relationships[relationship].data;
        if (relationshipData) {
          if (isArray(relationshipData)) {
            const relatedRecords = relationshipData as Record[];
            relatedRecords.forEach(relatedRecord => {
              this.add(relatedRecord, { record: recordIdentity, relationship })
            });
          } else {
            const relatedRecord = relationshipData as Record;
            this.add(relatedRecord, { record: recordIdentity, relationship })
          }
        }
      });
    }
  }

  recordRemoved(record: RecordIdentity): void {
    const recordInCache: Record = this._cache.records(record.type).get(record.id);
    const relationships = recordInCache && recordInCache.relationships;
    if (relationships) {
      Object.keys(relationships).forEach(relationship => {
        const relationshipData = relationships[relationship] && relationships[relationship].data;
        if (relationshipData) {
          if (isArray(relationshipData)) {
            const relatedRecords = relationshipData as Record[];
            relatedRecords.forEach(relatedRecord => {
              this.remove(relatedRecord, { record, relationship })
            });
          } else {
            const relatedRecord = relationshipData as Record;
            this.remove(relatedRecord, { record, relationship })
          }
        }
      });
    }
    this._relationships[record.type].remove(record.id);
  }

  relatedRecordAdded(record: RecordIdentity, relationship: string, relatedRecord: RecordIdentity): void {
    if (relatedRecord) {
      const relationshipDef = this._cache.schema.models[record.type].relationships[relationship];
      if (relationshipDef.inverse) {
        const recordIdentity = cloneRecordIdentity(record);
        this.add(relatedRecord, { record: recordIdentity, relationship });
      }
    }
  }

  relatedRecordsAdded(record: RecordIdentity, relationship: string, relatedRecords: RecordIdentity[]): void {
    if (relatedRecords && relatedRecords.length > 0) {
      const relationshipDef = this._cache.schema.models[record.type].relationships[relationship];
      if (relationshipDef.inverse) {
        const recordIdentity = cloneRecordIdentity(record);
        relatedRecords.forEach(relatedRecord => {
          this.add(relatedRecord, { record: recordIdentity, relationship });
        });
      }
    }
  }

  relatedRecordRemoved(record: RecordIdentity, relationship: string, relatedRecord?: RecordIdentity): void {
    const relationshipDef = this._cache.schema.models[record.type].relationships[relationship];

    if (relationshipDef.inverse) {
      if (relatedRecord === undefined) {
        const currentRecord = this._cache.records(record.type).get(record.id);
        relatedRecord = currentRecord && deepGet(currentRecord, ['relationships', relationship, 'data']);
      }

      if (relatedRecord) {
        this.remove(relatedRecord, { record, relationship });
      }
    }
  }

  relatedRecordsRemoved(record: RecordIdentity, relationship: string, relatedRecords?: RecordIdentity[]): void {
    const relationshipDef = this._cache.schema.models[record.type].relationships[relationship];

    if (relationshipDef.inverse) {
      if (relatedRecords === undefined) {
        const currentRecord = this._cache.records(record.type).get(record.id);
        relatedRecords = currentRecord && deepGet(currentRecord, ['relationships', relationship, 'data']);
      }

      if (relatedRecords) {
        relatedRecords.forEach(relatedRecord => this.remove(relatedRecord, { record, relationship }));
      }
    }
  }

  private add(record: RecordIdentity, inverseRelationship: InverseRelationship): void {
    let rels = this._relationships[record.type].get(record.id);
    rels = rels ? clone(rels) : [];
    rels.push(inverseRelationship);
    this._relationships[record.type].set(record.id, rels);
  }

  private remove(record: RecordIdentity, inverseRelationship: InverseRelationship): void {
    let rels = this._relationships[record.type].get(record.id);
    if (rels) {
      let newRels = rels.filter(r => !(r.record.type === inverseRelationship.record.type &&
                                       r.record.id === inverseRelationship.record.id &&
                                       r.relationship === inverseRelationship.relationship));
      this._relationships[record.type].set(record.id, newRels);
    }
  }
}
