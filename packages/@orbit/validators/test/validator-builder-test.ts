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
    assert.strictEqual(validatorFor('fake'), undefined);
  });

  test('returns an `unknown` validator for unrecognized types, if one has been registered', function (assert) {
    const validateUnknown = () => {
      // perhaps log an error or throw here
    };

    const validatorFor = buildValidatorFor({
      validators: {
        boolean: validateBoolean,
        string: validateString,
        unknown: validateUnknown
      }
    });

    assert.strictEqual(validatorFor('boolean'), validateBoolean);
    assert.strictEqual(validatorFor('string'), validateString);
    assert.strictEqual(validatorFor('fake'), validateUnknown);
  });
});
