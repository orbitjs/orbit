import { buildValidatorFor } from '../src/validator-builder';
import { validateBoolean } from '../src/boolean-validator';
import { validateString } from '../src/string-validator';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('buildValidatorFor', function (hooks) {
  test('returns a validatorFor fn, that returns a validator given a name', function (assert) {
    const validatorFor = buildValidatorFor({
      validators: {
        boolean: validateBoolean,
        string: validateString
      }
    });

    assert.strictEqual(validatorFor('boolean'), validateBoolean);
    assert.strictEqual(validatorFor('string'), validateString);
  });
});
