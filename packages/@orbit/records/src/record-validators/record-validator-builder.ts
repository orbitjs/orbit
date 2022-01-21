import { Dict } from '@orbit/utils';
import {
  buildValidatorFor,
  StandardValidator,
  standardValidators,
  ValidatorForFn
} from '@orbit/validators';
import { StandardRecordValidator } from './standard-record-validators';
import { standardRecordValidators } from './standard-record-validator-dict';

export function buildRecordValidatorFor(settings?: {
  validators?: Dict<StandardValidator | StandardRecordValidator>;
}): ValidatorForFn<StandardValidator | StandardRecordValidator> {
  return buildValidatorFor<StandardValidator | StandardRecordValidator>({
    validators: {
      ...standardValidators,
      ...standardRecordValidators,
      ...settings?.validators
    }
  });
}
