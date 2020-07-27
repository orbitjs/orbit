/* eslint-disable valid-jsdoc */
import { Orbit } from '@orbit/core';
import { isObject } from '@orbit/utils';
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
    return buildTransform(
      transformOrOperations(transformBuilder),
      transformOptions,
      transformId
    );
  } else {
    let transform = transformOrOperations as Transform;
    let operations: Operation[];
    let options: RequestOptions;

    if (isTransform(transform)) {
      if (transform.id && !transformOptions && !transformId) {
        return transform;
      }
      operations = transform.operations;
      options = transformOptions || transform.options;
    } else if (Array.isArray(transformOrOperations)) {
      operations = [];
      for (let transformOrOperation of transformOrOperations) {
        if (transformOrOperation instanceof OperationTerm) {
          operations.push(transformOrOperation.toOperation());
        } else {
          operations.push(transformOrOperation);
        }
      }
      options = transformOptions;
    } else {
      if (transformOrOperations instanceof OperationTerm) {
        operations = [transformOrOperations.toOperation()];
      } else {
        operations = [transformOrOperations as Operation];
      }
      options = transformOptions;
    }

    let id: string = transformId || Orbit.uuid();

    return { operations, options, id };
  }
}

function isTransform(transform: TransformOrOperations): transform is Transform {
  return isObject(transform) && (transform as any).operations;
}
