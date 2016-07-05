/* eslint-disable valid-jsdoc */
import Transform from 'orbit/transform';
import { coalesceOperations } from './operations';

/**
 Returns a single array containing all the operations in an array of transforms.

 @method operationsInTransforms
 @param {Array} transforms
 @returns {Array} Array of operations.
 */
export function operationsInTransforms(transforms) {
  const operations = [];

  transforms.forEach(t => {
    Array.prototype.push.apply(operations, t.operations);
  });

  return operations;
}

/**
 Reduces an array of transforms into a single transform containing a merged set
 of operations.

 @method reduceTransforms
 @param {Array} transforms
 @returns {Transform} A new Transform that contains a merged set of operations.
 */
export function reduceTransforms(transforms) {
  const operations = operationsInTransforms(transforms);

  return Transform.from(operations);
}

/**
 Reduces an array of transforms into a single transform containing a minimal set
 of equivalent coalesced operations.

 @method coalesceTransforms
 @param {Array} transforms
 @returns {Transform} A new Transform that contains a merged and coalesced set of operations.
 */
export function coalesceTransforms(transforms) {
  const operations = operationsInTransforms(transforms);
  const coalescedOperations = coalesceOperations(operations);

  return Transform.from(coalescedOperations);
}
