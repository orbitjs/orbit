import { validateArray } from '../src/array-validator';
import { validateBoolean } from '../src/boolean-validator';
import { validateDate } from '../src/date-validator';
import { validateNumber } from '../src/number-validator';
import { validateObject } from '../src/object-validator';
import { standardValidators } from '../src/standard-validators';
import { validateString } from '../src/string-validator';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('standardValidators', function (hooks) {
  test('includes a validator for all "standard" types', function (assert) {
    assert.strictEqual(standardValidators['array'], validateArray);
    assert.strictEqual(standardValidators['boolean'], validateBoolean);
    assert.strictEqual(standardValidators['date'], validateDate);
    assert.strictEqual(standardValidators['datetime'], validateDate);
    assert.strictEqual(standardValidators['number'], validateNumber);
    assert.strictEqual(standardValidators['object'], validateObject);
    assert.strictEqual(standardValidators['string'], validateString);
  });
});
