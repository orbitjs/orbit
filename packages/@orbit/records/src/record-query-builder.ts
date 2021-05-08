import { Orbit } from '@orbit/core';
import { QueryBuilderFunc } from '@orbit/data';
import { StandardValidator, ValidatorForFn } from '@orbit/validators';
import { RecordIdentity } from './record';
import { RecordNormalizer } from './record-normalizer';
import {
  FindRecords,
  FindRelatedRecords,
  RecordQueryExpression
} from './record-query-expression';
import {
  FindRecordsTerm,
  FindRecordTerm,
  FindRelatedRecordTerm
} from './record-query-term';
import { RecordSchema } from './record-schema';
import { StandardRecordValidator } from './record-validators/standard-record-validators';

const { assert } = Orbit;

export type RecordQueryBuilderFunc = QueryBuilderFunc<
  RecordQueryExpression,
  RecordQueryBuilder
>;

export interface RecordQueryBuilderSettings<RT = string, RI = RecordIdentity> {
  schema?: RecordSchema;
  normalizer?: RecordNormalizer<RT, RI>;
  validatorFor?: ValidatorForFn<StandardValidator | StandardRecordValidator>;
}

export class RecordQueryBuilder<RT = string, RI = RecordIdentity> {
  $schema?: RecordSchema;
  $normalizer?: RecordNormalizer<RT, RI>;
  $validatorFor?: ValidatorForFn<StandardValidator | StandardRecordValidator>;

  constructor(settings: RecordQueryBuilderSettings<RT, RI> = {}) {
    const { schema, normalizer, validatorFor } = settings;

    if (validatorFor) {
      assert(
        'A RecordQueryBuilder that has been assigned a `validatorFor` requires a `schema`',
        schema !== undefined
      );
    }

    this.$schema = schema;
    this.$normalizer = normalizer;
    this.$validatorFor = validatorFor;
  }

  /**
   * Find a record by its identity.
   */
  findRecord(record: RI): FindRecordTerm<RT, RI> {
    return new FindRecordTerm(this, this.$normalizeRecordIdentity(record));
  }

  /**
   * Find all records of a specific type.
   *
   * If `type` is unspecified, find all records unfiltered by type.
   */
  findRecords(typeOrIdentities?: RT | RI[]): FindRecordsTerm<RT, RI> {
    const expression: FindRecords = {
      op: 'findRecords'
    };

    if (Array.isArray(typeOrIdentities)) {
      expression.records = typeOrIdentities.map((ri) =>
        this.$normalizeRecordIdentity(ri)
      );
    } else if (typeOrIdentities !== undefined) {
      expression.type = this.$normalizeRecordType(typeOrIdentities);
    }

    return new FindRecordsTerm(this, expression);
  }

  /**
   * Find a record in a to-one relationship.
   */
  findRelatedRecord(
    record: RI,
    relationship: string
  ): FindRelatedRecordTerm<RT, RI> {
    return new FindRelatedRecordTerm(
      this,
      this.$normalizeRecordIdentity(record),
      relationship
    );
  }

  /**
   * Find records in a to-many relationship.
   */
  findRelatedRecords(
    record: RI,
    relationship: string
  ): FindRecordsTerm<RT, RI> {
    const expression: FindRelatedRecords = {
      op: 'findRelatedRecords',
      record: this.$normalizeRecordIdentity(record),
      relationship
    };

    return new FindRecordsTerm(this, expression);
  }

  $normalizeRecordType(rt: RT): string {
    if (this.$normalizer !== undefined) {
      return this.$normalizer.normalizeRecordType(rt);
    } else {
      return (rt as unknown) as string;
    }
  }

  $normalizeRecordIdentity(ri: RI): RecordIdentity {
    if (this.$normalizer !== undefined) {
      return this.$normalizer.normalizeRecordIdentity(ri);
    } else {
      return (ri as unknown) as RecordIdentity;
    }
  }
}
