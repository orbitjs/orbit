import { buildInflector } from '../src/inflector';

const { module, test } = QUnit;

module('inflectors', function () {
  test('#buildInflector can create an inflector from mappings', function (assert) {
    const inflector = buildInflector({ cow: 'kine', person: 'people' });
    assert.equal(inflector('cow'), 'kine');
    assert.equal(inflector('person'), 'people');
    assert.throws(() => {
      inflector('unknown');
    }, 'throws on unmapped entries');
  });

  test('#buildInflector can create an inflector from mappings, with a fallback inflector', function (assert) {
    const fallbackInflector = (input: string) => `${input}z`;
    const inflector = buildInflector(
      { cow: 'kine', person: 'people' },
      fallbackInflector
    );
    assert.equal(inflector('cow'), 'kine');
    assert.equal(inflector('person'), 'people');
    assert.equal(inflector('unknown'), 'unknownz');
  });
});
