import { deepMerge } from '@orbit/utils';
import { Operation } from './operation';
import { RequestOptions } from './request';

/**
 * Operation terms are used by transform builders to allow for the construction of
 * operations in composable patterns.
 */
export class OperationTerm<O extends Operation> {
  operation: O;

  constructor(operation: O) {
    this.operation = operation;
  }

  toOperation(): O {
    return this.operation;
  }

  options(options: RequestOptions): this {
    this.operation.options = deepMerge(this.operation.options || {}, options);
    return this;
  }
}
