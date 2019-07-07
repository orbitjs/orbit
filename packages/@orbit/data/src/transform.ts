/* eslint-disable valid-jsdoc */
import Orbit from './main';
import { Operation } from './operation';
import { isObject } from '@orbit/utils';
import TransformBuilder from './transform-builder';

export type TransformBuilderFunc = (
  TransformBuilder: TransformBuilder
) => Operation | Operation[];
export type TransformOrOperations =
  | Transform
  | Operation
  | Operation[]
  | TransformBuilderFunc;

/**
 * A Transform represents a set of operations that can mutate a source.
 */
export interface Transform {
  id: string;
  operations: Operation[];
  options?: any;
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
  transformOptions?: object,
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
    let options: object;

    if (isObject(transform) && transform.operations) {
      if (transform.id && !transformOptions && !transformId) {
        return transform;
      }
      operations = transform.operations;
      options = transformOptions || transform.options;
    } else {
      if (Array.isArray(transformOrOperations)) {
        operations = transformOrOperations as Operation[];
      } else {
        operations = [transformOrOperations as Operation];
      }
      options = transformOptions;
    }

    let id: string = transformId || Orbit.uuid();

    return { operations, options, id };
  }
}
