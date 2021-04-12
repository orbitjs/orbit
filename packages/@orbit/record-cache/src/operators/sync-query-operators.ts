import { QueryExpressionParseError, RequestOptions } from '@orbit/data';
import {
  AttributeSortSpecifier,
  FindRecord,
  FindRecords,
  FindRelatedRecord,
  FindRelatedRecords,
  InitializedRecord,
  RecordIdentity,
  RecordNotFoundException,
  RecordQueryExpression,
  RecordQueryExpressionResult,
  SortSpecifier
} from '@orbit/records';
import { deepGet, Dict, isNone } from '@orbit/utils';
import { SyncRecordAccessor } from '../record-accessor';

export interface SyncQueryOperator {
  (
    cache: SyncRecordAccessor,
    expression: RecordQueryExpression,
    options?: RequestOptions
  ): RecordQueryExpressionResult;
}

export const SyncQueryOperators: Dict<SyncQueryOperator> = {
  findRecord(
    cache: SyncRecordAccessor,
    expression: RecordQueryExpression,
    options?: RequestOptions
  ): InitializedRecord | undefined {
    const { record } = expression as FindRecord;
    const currentRecord = cache.getRecordSync(record);

    if (!currentRecord) {
      if (options?.raiseNotFoundExceptions) {
        throw new RecordNotFoundException(record.type, record.id);
      }
    }

    return currentRecord;
  },

  findRecords(
    cache: SyncRecordAccessor,
    expression: RecordQueryExpression,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options?: RequestOptions
  ): InitializedRecord[] {
    let exp = expression as FindRecords;
    let results = cache.getRecordsSync(exp.records || exp.type);
    if (exp.filter) {
      results = filterRecords(results, exp.filter);
    }
    if (exp.sort) {
      results = sortRecords(results, exp.sort);
    }
    if (exp.page) {
      results = paginateRecords(results, exp.page);
    }
    return results;
  },

  findRelatedRecords(
    cache: SyncRecordAccessor,
    expression: RecordQueryExpression,
    options?: RequestOptions
  ): InitializedRecord[] | undefined {
    const exp = expression as FindRelatedRecords;
    const { record, relationship } = exp;
    const relatedIds = cache.getRelatedRecordsSync(record, relationship);
    if (!relatedIds || relatedIds.length === 0) {
      if (!cache.getRecordSync(record)) {
        if (options?.raiseNotFoundExceptions) {
          throw new RecordNotFoundException(record.type, record.id);
        } else {
          return undefined;
        }
      }

      return [];
    }
    let results = cache.getRecordsSync(relatedIds);

    if (exp.filter) {
      results = filterRecords(results, exp.filter);
    }
    if (exp.sort) {
      results = sortRecords(results, exp.sort);
    }
    if (exp.page) {
      results = paginateRecords(results, exp.page);
    }
    return results;
  },

  findRelatedRecord(
    cache: SyncRecordAccessor,
    expression: RecordQueryExpression,
    options?: RequestOptions
  ): InitializedRecord | null | undefined {
    const exp = expression as FindRelatedRecord;
    const { record, relationship } = exp;
    const relatedId = cache.getRelatedRecordSync(record, relationship);

    if (relatedId) {
      return cache.getRecordSync(relatedId) || null;
    } else {
      if (!cache.getRecordSync(record)) {
        if (options?.raiseNotFoundExceptions) {
          throw new RecordNotFoundException(record.type, record.id);
        } else {
          return undefined;
        }
      }

      return null;
    }
  }
};

function filterRecords(records: InitializedRecord[], filters: any[]) {
  return records.filter((record) => {
    for (let i = 0, l = filters.length; i < l; i++) {
      if (!applyFilter(record, filters[i])) {
        return false;
      }
    }
    return true;
  });
}

function applyFilter(record: InitializedRecord, filter: any): boolean {
  if (filter.kind === 'attribute') {
    let actual = deepGet(record, ['attributes', filter.attribute]);
    if (actual === undefined) {
      return false;
    }
    let expected = filter.value;
    switch (filter.op) {
      case 'equal':
        return actual === expected;
      case 'gt':
        return actual > expected;
      case 'gte':
        return actual >= expected;
      case 'lt':
        return actual < expected;
      case 'lte':
        return actual <= expected;
      default:
        throw new QueryExpressionParseError(
          'Filter operation ${filter.op} not recognized for Store.'
        );
    }
  } else if (filter.kind === 'relatedRecords') {
    let actual: RecordIdentity[] = deepGet(record, [
      'relationships',
      filter.relation,
      'data'
    ]);
    if (actual === undefined) {
      return false;
    }
    let expected: RecordIdentity[] = filter.records;
    switch (filter.op) {
      case 'equal':
        return (
          actual.length === expected.length &&
          expected.every((e) =>
            actual.some((a) => a.id === e.id && a.type === e.type)
          )
        );
      case 'all':
        return expected.every((e) =>
          actual.some((a) => a.id === e.id && a.type === e.type)
        );
      case 'some':
        return expected.some((e) =>
          actual.some((a) => a.id === e.id && a.type === e.type)
        );
      case 'none':
        return !expected.some((e) =>
          actual.some((a) => a.id === e.id && a.type === e.type)
        );
      default:
        throw new QueryExpressionParseError(
          'Filter operation ${filter.op} not recognized for Store.'
        );
    }
  } else if (filter.kind === 'relatedRecord') {
    let actual = deepGet(record, ['relationships', filter.relation, 'data']);
    if (actual === undefined) {
      return false;
    }
    let expected = filter.record;
    switch (filter.op) {
      case 'equal':
        if (actual === null) {
          return expected === null;
        } else {
          if (Array.isArray(expected)) {
            return expected.some(
              (e) => actual.type === e.type && actual.id === e.id
            );
          } else if (expected) {
            return actual.type === expected.type && actual.id === expected.id;
          } else {
            return false;
          }
        }
      default:
        throw new QueryExpressionParseError(
          'Filter operation ${filter.op} not recognized for Store.'
        );
    }
  }
  return false;
}

function sortRecords(
  records: InitializedRecord[],
  sortSpecifiers: SortSpecifier[]
): InitializedRecord[] {
  const comparisonValues = new Map();

  records.forEach((record) => {
    comparisonValues.set(
      record,
      sortSpecifiers.map((sortSpecifier) => {
        if (sortSpecifier.kind === 'attribute') {
          return deepGet(record, [
            'attributes',
            (sortSpecifier as AttributeSortSpecifier).attribute
          ]);
        } else {
          throw new QueryExpressionParseError(
            'Sort specifier ${sortSpecifier.kind} not recognized for Store.'
          );
        }
      })
    );
  });

  const comparisonOrders = sortSpecifiers.map((sortExpression) =>
    sortExpression.order === 'descending' ? -1 : 1
  );

  return records.sort((record1, record2) => {
    const values1 = comparisonValues.get(record1);
    const values2 = comparisonValues.get(record2);
    for (let i = 0; i < sortSpecifiers.length; i++) {
      if (values1[i] < values2[i]) {
        return -comparisonOrders[i];
      } else if (values1[i] > values2[i]) {
        return comparisonOrders[i];
      } else if (isNone(values1[i]) && !isNone(values2[i])) {
        return comparisonOrders[i];
      } else if (isNone(values2[i]) && !isNone(values1[i])) {
        return -comparisonOrders[i];
      }
    }
    return 0;
  });
}

function paginateRecords(
  records: InitializedRecord[],
  paginationOptions: any
): InitializedRecord[] {
  if (paginationOptions.limit !== undefined) {
    let offset =
      paginationOptions.offset === undefined ? 0 : paginationOptions.offset;
    let limit = paginationOptions.limit;

    return records.slice(offset, offset + limit);
  } else {
    throw new QueryExpressionParseError(
      'Pagination options not recognized for Store. Please specify `offset` and `limit`.'
    );
  }
}
