import { Dict, deepGet, merge, every, some, isNone } from '@orbit/utils';
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
  RecordIdentity
} from '@orbit/data';
import Cache from '../cache';

const EMPTY = () => {};

/**
 * @export
 * @interface QueryOperator
 */
export interface QueryOperator {
  (cache: Cache, expression: QueryExpression): any;
}

export const QueryOperators: Dict<QueryOperator> = {
  findRecord(cache: Cache, expression: FindRecord) {
    const { type, id } = expression.record;
    const record = cache.records(type).get(id);

    if (!record) {
      throw new RecordNotFoundException(type, id);
    }

    return record;
  },

  findRecords(cache: Cache, expression: FindRecords) {
    let results = cache.records(expression.type).values;
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

  findRelatedRecords(cache: Cache, expression: FindRelatedRecords) {
    const { record, relationship } = expression;
    const { type, id } = record;
    const currentRecord = cache.records(type).get(id);
    const data = currentRecord && deepGet(currentRecord, ['relationships', relationship, 'data']);

    if (!data) { return []; }

    return (data as RecordIdentity[]).map(r => cache.records(r.type).get(r.id));
  },

  findRelatedRecord(cache: Cache, expression: FindRelatedRecord) {
    const { record, relationship } = expression;
    const { type, id } = record;
    const currentRecord = cache.records(type).get(id);
    const data = currentRecord && deepGet(currentRecord, ['relationships', relationship, 'data']);

    if (!data) { return null; }

    const r = data as RecordIdentity;
    return cache.records(r.type).get(r.id);
  }
};

function filterRecords(records, filters) {
  return records.filter(record => {
    for (let i = 0, l = filters.length; i < l; i++) {
      if (!applyFilter(record, filters[i])) {
        return false;
      }
    }
    return true;
  });
}

function applyFilter(record, filter) {
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
  }
  return false;
}

function sortRecords(records, sortSpecifiers: SortSpecifier[]) {
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

function paginateRecords(records, paginationOptions) {
  if (paginationOptions.limit !== undefined) {
    let offset = paginationOptions.offset === undefined ? 0 : paginationOptions.offset;
    let limit = paginationOptions.limit;

    return records.slice(offset, offset + limit);

  } else {
    throw new QueryExpressionParseError('Pagination options not recognized for Store. Please specify `offset` and `limit`.', paginationOptions);
  }
}
