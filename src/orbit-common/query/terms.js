import { queryExpression as oqe } from 'orbit/query/expression';
import {
  Cursor,
  TermBase,
  Value
} from 'orbit/query/terms';

export class RecordCursor extends Cursor {
  attribute(name) {
    return new Value(oqe('attribute', name));
  }
}

export class Record extends TermBase {
  constructor(record) {
    super(oqe('record', record));
  }
}

export class Records extends TermBase {
  filter(predicateExpression) {
    const filterBuilder = new RecordCursor();
    return new this.constructor(oqe('filter', this.expression, predicateExpression(filterBuilder)));
  }

  filterAttributes(attributeValues) {
    const attributeExpressions = Object.keys(attributeValues).map(attribute => {
      return oqe('equal',
               oqe('attribute', attribute),
               attributeValues[attribute]);
    });

    const andExpression = attributeExpressions.length === 1 ? attributeExpressions[0]
                                                            : oqe('and', ...attributeExpressions);

    return new this.constructor(oqe('filter', this.expression, andExpression));
  }

  static withScopes(scopes) {
    const typeTerm = function(oqe) {
      Records.call(this, oqe);
    };

    typeTerm.prototype = Object.create(Records.prototype);
    Object.assign(typeTerm.prototype, scopes);

    return typeTerm;
  }
}

export class RelatedRecord extends TermBase {
  constructor(record, relationship) {
    super(oqe('relatedRecord', record, relationship));
  }
}

export class RelatedRecords extends TermBase {
  constructor(record, relationship) {
    super(oqe('relatedRecords', record, relationship));
  }
}
