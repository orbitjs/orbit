import { formatValidationDescription } from '../src/validator';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('formatValidationDescription', function (hooks) {
  test('includes summary only if no issues are included', function (assert) {
    assert.strictEqual(formatValidationDescription('summary', []), 'summary');
  });

  test('includes summary followed by issue descriptions', function (assert) {
    assert.strictEqual(
      formatValidationDescription('summary', [
        {
          validator: 'v1',
          validation: 'v1-a',
          description: 'a'
        },
        {
          validator: 'v2',
          validation: 'v2-a',
          description: 'b'
        },
        {
          validator: 'v3',
          validation: 'v3-a',
          description: 'c'
        }
      ]),
      `summary\n- a\n- b\n- c`
    );
  });

  test('nests any new lines in issue descriptions', function (assert) {
    assert.strictEqual(
      formatValidationDescription('summary', [
        {
          validator: 'v1',
          validation: 'v1-a',
          description: 'a\n- a1\n- a2'
        },
        {
          validator: 'v2',
          validation: 'v2-a',
          description: 'b'
        },
        {
          validator: 'v3',
          validation: 'v3-a',
          description: 'c'
        }
      ]),
      `summary\n- a\n  - a1\n  - a2\n- b\n- c`
    );
  });
});
