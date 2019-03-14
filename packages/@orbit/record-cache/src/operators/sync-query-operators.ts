import { Dict, deepGet, isNone } from '@orbit/utils';
import {
  QueryExpression,
  RecordNotFoundException,
  QueryExpressionParseError,
  FindRecord,
  FindRecords,
  FindRelatedRecord,
  FindRelatedRecords,
  SortSpecifier,
  AttributeSortSpecifier,
  Record,
  RecordIdentity
} from '@orbit/data';
import { SyncRecordAccessor } from '../record-accessor';
import { QueryResultData } from '../query-result';

export interface SyncQueryOperator {
  (cache: SyncRecordAccessor, expression: QueryExpression): QueryResultData;
}

export const SyncQueryOperators: Dict<SyncQueryOperator> = {
  findRecord(cache: SyncRecordAccessor, expression: FindRecord): Record {
    const { record } = expression;
    const currentRecord = cache.getRecordSync(record);

    if (!currentRecord) {
      throw new RecordNotFoundException(record.type, record.id);
    }

    return currentRecord;
  },

  findRecords(cache: SyncRecordAccessor, expression: FindRecords): Record[] {
    let results = cache.getRecordsSync(expression.records || expression.type);
    if (expression.filter) {
      results = filterRecords(results, expression.filter);
    }
    if (expression.sort) {
      results = sortRecords(results, expression.sort);
    }
    if (expression.page) {
      results = paginateRecords(results, expression.page);
    }
    return results;
  },

  findRelatedRecords(cache: SyncRecordAccessor, expression: FindRelatedRecords): Record[] {
    const { record, relationship } = expression;
    const relatedIds = cache.getRelatedRecordsSync(record, relationship);
    if (!relatedIds) {
      if (!cache.getRecordSync(record)) {
        throw new RecordNotFoundException(record.type, record.id);
      }

      return [];
    }

    return cache.getRecordsSync(relatedIds);
  },

  findRelatedRecord(cache: SyncRecordAccessor, expression: FindRelatedRecord): Record {
    const { record, relationship } = expression;
    const relatedId = cache.getRelatedRecordSync(record, relationship);
    if (relatedId) {
      return cache.getRecordSync(relatedId);
    } else {
      if (!cache.getRecordSync(record)) {
        throw new RecordNotFoundException(record.type, record.id);
      }

      return null;
    }
  }
};

function filterRecords(records: Record[], filters: any[]) {
  return records.filter(record => {
    for (let i = 0, l = filters.length; i < l; i++) {
      if (!applyFilter(record, filters[i])) {
        return false;
      }
    }
    return true;
  });
}

function applyFilter(record: Record, filter: any) {
  if (filter.kind === 'attribute') {
    let actual = deepGet(record, ['attributes', filter.attribute]);
    let expected = filter.value;
    switch(filter.op) {
      case 'equal': return actual === expected;
      case 'gt':    return actual > expected;
      case 'gte':   return actual >= expected;
      case 'lt':    return actual < expected;
      case 'lte':   return actual <= expected;
      default:
        throw new QueryExpressionParseError('Filter operation ${filter.op} not recognized for Store.', filter);
    }
  } else if (filter.kind === 'relatedRecords') {
    let relation = deepGet(record, ['relationships', filter.relation]);
    let actual: RecordIdentity[] = relation === undefined ? [] : relation.data;
    let expected: RecordIdentity[] = filter.records;
    switch (filter.op) {
      case 'equal':
        return actual.length === expected.length
          && expected.every(e => actual.some(a => a.id === e.id && a.type === e.type));
      case 'all':
        return expected.every(e => actual.some(a => a.id === e.id && a.type === e.type));
      case 'some':
        return expected.some(e => actual.some(a => a.id === e.id && a.type === e.type));
      case 'none':
        return !expected.some(e => actual.some(a => a.id === e.id && a.type === e.type));
      default:
        throw new QueryExpressionParseError('Filter operation ${filter.op} not recognized for Store.', filter);
    }
  } else if (filter.kind === 'relatedRecord') {
    let relation = deepGet(record, ["relationships", filter.relation]);
    let actual = relation === undefined ? undefined : relation.data;
    let expected = filter.record;
    switch (filter.op) {
      case 'equal':
        if (Array.isArray(expected)) {
          return actual !== undefined && expected.some(e => actual.type === e.type && actual.id === e.id);
        } else {
          return actual !== undefined && actual.type === expected.type && actual.id === expected.id;
        }
      default:
        throw new QueryExpressionParseError('Filter operation ${filter.op} not recognized for Store.', filter);
    }
  }
  return false;
}

function sortRecords(records: Record[], sortSpecifiers: SortSpecifier[]) {
  const comparisonValues = new Map();

  records.forEach(record => {
    comparisonValues.set(
      record,
      sortSpecifiers.map(sortSpecifier => {
        if (sortSpecifier.kind === 'attribute') {
          return deepGet(record, ['attributes' , (<AttributeSortSpecifier>sortSpecifier).attribute])
        } else {
          throw new QueryExpressionParseError('Sort specifier ${sortSpecifier.kind} not recognized for Store.', sortSpecifier);
        }
      })
    );
  });

  const comparisonOrders = sortSpecifiers.map(
    sortExpression => sortExpression.order === 'descending' ? -1 : 1);

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

function paginateRecords(records: Record[], paginationOptions: any) {
  if (paginationOptions.limit !== undefined) {
    let offset = paginationOptions.offset === undefined ? 0 : paginationOptions.offset;
    let limit = paginationOptions.limit;

    return records.slice(offset, offset + limit);

  } else {
    throw new QueryExpressionParseError('Pagination options not recognized for Store. Please specify `offset` and `limit`.', paginationOptions);
  }
}
