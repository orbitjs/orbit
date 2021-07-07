import { Validator } from './validator';
import { Dict } from '@orbit/utils';

export type ValidatorForFn<V = Validator> = (type: string) => V | undefined;

export function buildValidatorFor<V = Validator>(settings: {
  validators: Dict<V>;
}): ValidatorForFn<V> {
  const { validators } = settings;

  function validatorFor(type: string): V | undefined {
    return validators[type] ?? validators['unknown'];
  }

  return validatorFor;
}
