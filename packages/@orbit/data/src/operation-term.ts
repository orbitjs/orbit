import { deepMerge } from '@orbit/utils';
import { Operation } from './operation';
import { RequestOptions } from './request';

/**
 * Operation terms are used by transform builders to allow for the construction of
 * operations in composable patterns.
 */
export class OperationTerm<O extends Operation> {
  protected _operation: O;

  constructor(operation: O) {
    this._operation = operation;
  }

  toOperation(): O {
    return this._operation;
  }

  options(options: RequestOptions): this {
    this._operation.options = deepMerge(this._operation.options || {}, options);
    return this;
  }
}
