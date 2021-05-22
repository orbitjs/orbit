import { Dict } from '@orbit/utils';
import {
  buildValidatorFor,
  StandardValidator,
  standardValidators,
  ValidatorForFn
} from '@orbit/validators';
import { StandardRecordValidator } from './standard-record-validators';
import { standardRecordValidators } from './standard-record-validator-dict';

export function buildRecordValidatorFor<
  V = StandardValidator | StandardRecordValidator
>(settings?: { validators?: Dict<V> }): ValidatorForFn<V> {
  const validators: Dict<V> = {};

  Object.assign(validators, standardValidators);
  Object.assign(validators, standardRecordValidators);

  const customValidators = settings?.validators;
  if (customValidators) {
    Object.assign(validators, customValidators);
  }

  return buildValidatorFor<V>({
    validators
  });
}
