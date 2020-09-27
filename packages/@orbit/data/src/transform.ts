/* eslint-disable valid-jsdoc */
import { Orbit } from '@orbit/core';
import { Operation } from './operation';
import { OperationTerm } from './operation-term';
import { TransformBuilder } from './transform-builder';
import { RequestOptions } from './request';

export type TransformBuilderFunc = (
  TransformBuilder: TransformBuilder
) => Operation | Operation[] | OperationTerm | OperationTerm[];
export type TransformOrOperations =
  | Transform
  | Operation
  | Operation[]
  | OperationTerm
  | OperationTerm[]
  | TransformBuilderFunc;

/**
 * A Transform represents a set of operations that can mutate a source.
 */
export interface Transform {
  id: string;
  operations: Operation[];
  options?: RequestOptions;
}

/**
 * A builder function for creating a Transform from its constituent parts.
 *
 * If a `Transform` is passed in with an `id` and `operations`, and no
 * replacement `id` or `options` are also passed in, then the `Transform`
 * will be returned unchanged.
 *
 * For all other cases, a new `Transform` object will be created and returned.
 *
 * Transforms will be assigned the specified `transformId` as `id`. If none
 * is specified, a UUID will be generated.
 */
export function buildTransform(
  transformOrOperations: TransformOrOperations,
  transformOptions?: RequestOptions,
  transformId?: string,
  transformBuilder?: TransformBuilder
): Transform {
  if (typeof transformOrOperations === 'function') {
    const transformBuilderFn = transformOrOperations as TransformBuilderFunc;
    return buildTransform(
      transformBuilderFn(transformBuilder as TransformBuilder),
      transformOptions,
      transformId
    );
  } else {
    let transform = transformOrOperations as Transform;
    let operations: Operation[];
    let options: RequestOptions | undefined;

    if (isTransform(transform)) {
      if (transform.id && !transformOptions && !transformId) {
        return transform;
      }
      operations = transform.operations;
      options = transformOptions || transform.options;
    } else if (Array.isArray(transformOrOperations)) {
      operations = [];
      for (let transformOrOperation of transformOrOperations) {
        operations.push(toOperation(transformOrOperation));
      }
      options = transformOptions;
    } else {
      operations = [
        toOperation(transformOrOperations as Operation | OperationTerm)
      ];
      options = transformOptions;
    }

    let id: string = transformId || Orbit.uuid();

    return { operations, options, id };
  }
}

function toOperation(operation: Operation | OperationTerm): Operation {
  if (isOperationTerm(operation)) {
    return (operation as OperationTerm).toOperation();
  } else {
    return operation;
  }
}

function isOperationTerm(
  operation: Operation | OperationTerm
): operation is OperationTerm {
  return typeof (operation as OperationTerm).toOperation === 'function';
}

function isTransform(transform: TransformOrOperations): transform is Transform {
  return Array.isArray((transform as Transform).operations);
}
