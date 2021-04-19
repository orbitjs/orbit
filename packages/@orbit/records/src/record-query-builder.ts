import { QueryBuilderFunc } from '@orbit/data';
import { RecordIdentity } from './record';
import { RecordNormalizer } from './record-normalizer';
import { RecordQueryExpression } from './record-query-expression';
import {
  FindRecordsTerm,
  FindRecordTerm,
  FindRelatedRecordsTerm,
  FindRelatedRecordTerm
} from './record-query-term';

export type RecordQueryBuilderFunc = QueryBuilderFunc<
  RecordQueryExpression,
  RecordQueryBuilder
>;

export interface RecordQueryBuilderSettings<RT = string, RI = RecordIdentity> {
  normalizer?: RecordNormalizer<RT, RI>;
}

export class RecordQueryBuilder<RT = string, RI = RecordIdentity> {
  protected _normalizer?: RecordNormalizer<RT, RI>;

  constructor(settings: RecordQueryBuilderSettings<RT, RI> = {}) {
    this._normalizer = settings.normalizer;
  }

  get normalizer(): RecordNormalizer<RT, RI> | undefined {
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
  findRecords(typeOrIdentities?: RT | RI[]): FindRecordsTerm {
    if (Array.isArray(typeOrIdentities)) {
      return new FindRecordsTerm(
        typeOrIdentities.map((ri) => this.normalizeRecordIdentity(ri))
      );
    } else if (typeOrIdentities === undefined) {
      return new FindRecordsTerm();
    } else {
      return new FindRecordsTerm(this.normalizeRecordType(typeOrIdentities));
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

  protected normalizeRecordType(recordType: RT): string {
    if (this._normalizer !== undefined) {
      return this._normalizer.normalizeRecordType(recordType);
    } else {
      return (recordType as unknown) as string;
    }
  }

  protected normalizeRecordIdentity(recordIdentity: RI): RecordIdentity {
    if (this._normalizer !== undefined) {
      return this._normalizer.normalizeRecordIdentity(recordIdentity);
    } else {
      return (recordIdentity as unknown) as RecordIdentity;
    }
  }
}
