import { queryExpression as oqe } from 'orbit-common/oql/expressions';

class TermBase {
  constructor(oqe) {
    this._oqe = oqe;
  }
}

class Cursor extends TermBase {
  get(path) {
    return new Value(oqe('get', path));
  }
}

class Value extends TermBase {
  equal(value) {
    return oqe('equal', this._oqe, value);
  }
}

export {
  TermBase,
  Cursor
};
