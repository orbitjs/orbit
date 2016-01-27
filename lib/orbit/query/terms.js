import { queryExpression as oqe } from './expression';

export class TermBase {
  constructor(oqe) {
    this._oqe = oqe;
  }
}

export class Cursor extends TermBase {
  get(path) {
    return new Value(oqe('get', path));
  }
}

export class Value extends TermBase {
  equal(value) {
    return oqe('equal', this._oqe, value);
  }
}
