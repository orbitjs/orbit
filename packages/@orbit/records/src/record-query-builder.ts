import { QueryBuilderFunc } from '@orbit/data';
import { RecordIdentity, RecordNormalizer } from './record';
import { RecordQueryExpression } from './record-query-expression';
import {
  FindRecordTerm,
  FindRecordsTerm,
  FindRelatedRecordTerm,
  FindRelatedRecordsTerm
} from './record-query-term';

export type RecordQueryBuilderFunc = QueryBuilderFunc<
  RecordQueryExpression,
  RecordQueryBuilder
>;

export interface RecordQueryBuilderSettings<RI = RecordIdentity> {
  normalizer?: RecordNormalizer<RI>;
}

export class RecordQueryBuilder<RI = RecordIdentity> {
  protected _normalizer?: RecordNormalizer<RI>;

  constructor(settings: RecordQueryBuilderSettings<RI> = {}) {
    this._normalizer = settings.normalizer;
  }

  get normalizer(): RecordNormalizer<RI> | undefined {
    return this._normalizer;
  }

  /**
   * Find a record by its identity.
   */
  findRecord(record: RI): FindRecordTerm {
    return new FindRecordTerm(this.normalizeRecordIdentity(record));
  }

  /**
   * Find all records of a specific type.
   *
   * If `type` is unspecified, find all records unfiltered by type.
   */
  findRecords(typeOrIdentities?: string | RI[]): FindRecordsTerm {
    if (Array.isArray(typeOrIdentities)) {
      return new FindRecordsTerm(
        typeOrIdentities.map((ri) => this.normalizeRecordIdentity(ri))
      );
    } else {
      return new FindRecordsTerm(typeOrIdentities);
    }
  }

  /**
   * Find a record in a to-one relationship.
   */
  findRelatedRecord(record: RI, relationship: string): FindRelatedRecordTerm {
    return new FindRelatedRecordTerm(
      this.normalizeRecordIdentity(record),
      relationship
    );
  }

  /**
   * Find records in a to-many relationship.
   */
  findRelatedRecords(record: RI, relationship: string): FindRelatedRecordsTerm {
    return new FindRelatedRecordsTerm(
      this.normalizeRecordIdentity(record),
      relationship
    );
  }

  protected normalizeRecordIdentity(recordIdentity: RI): RecordIdentity {
    if (this._normalizer !== undefined) {
      return this._normalizer.normalizeRecordIdentity(recordIdentity);
    } else {
      return (recordIdentity as unknown) as RecordIdentity;
    }
  }
}
