import { diffs } from '../../src/lib/diffs';

const { module, test } = QUnit;

module('Lib / diffs', function() {
  test('#diffs return `undefined` for matching objects', function(assert) {
    var a, b;

    a = { name: 'Jupiter', classification: 'gas giant' };
    b = { name: 'Jupiter', classification: 'gas giant' };

    assert.deepEqual(diffs(a, b), undefined);

    a = { id: { a: '1', b: '2' }, name: 'Jupiter', classification: 'gas giant' };
    b = { id: { a: '1', b: '2' }, name: 'Jupiter', classification: 'gas giant' };

    assert.deepEqual(diffs(a, b), undefined);

    a = { id: { a: '1', b: '2' }, name: 'Jupiter', classification: 'gas giant', links: [{ moons: ['a', 'b'] }] };
    b = { id: { a: '1', b: '2' }, name: 'Jupiter', classification: 'gas giant', links: [{ moons: ['a', 'b'] }] };

    assert.deepEqual(diffs(a, b), undefined);

    a = { id: { a: '1', b: '2' }, name: 'Jupiter', classification: 'gas giant', links: [{ moons: ['a', 'b'] }] };
    b = { id: { b: '2', a: '1' }, classification: 'gas giant', name: 'Jupiter', links: [{ moons: ['a', 'b'] }] };

    assert.deepEqual(diffs(a, b), undefined);
  });

  test('#diffs generates `add` patches when comparing two objects (as per rfc 6902)', function(assert) {
    var a, b;

    // RFC 6902 - Appendix A.1.  Adding an Object Member
    a = { foo: 'bar' };
    b = { foo: 'bar', 'baz': 'qux' };

    assert.deepEqual(diffs(a, b),
                     [{ op: 'add', path: '/baz', value: 'qux' }]);

    // RFC 6902 - Appendix A.2.  Adding an Array Element
    a = { foo: ['bar', 'baz'] };
    b = { foo: ['bar', 'qux', 'baz'] };

    assert.deepEqual(diffs(a, b),
                     [{ op: 'add', path: '/foo/1', value: 'qux' }]);

    // Adding multiple array elements
    a = { foo: ['BAR', 'BAZ'] };
    b = { foo: ['BAR', 'qux', 'dux', 'BAZ'] };

    assert.deepEqual(diffs(a, b),
                     [{ op: 'add', path: '/foo/1', value: 'qux' },
                      { op: 'add', path: '/foo/2', value: 'dux' }]);

    // Adding multiple array elements
    a = { foo: ['BAR', 'BAZ'] };
    b = { foo: ['BAR', 'qux', 'dux', 'BAZ', 'flux'] };

    assert.deepEqual(diffs(a, b),
                     [{ op: 'add', path: '/foo/1', value: 'qux' },
                      { op: 'add', path: '/foo/2', value: 'dux' },
                      { op: 'add', path: '/foo/4', value: 'flux' }]);

    // Misc tests
    a = { name: 'Jupiter', classification: 'gas giant' };
    b = { id: 12345, name: 'Jupiter', classification: 'gas giant' };

    assert.deepEqual(diffs(a, b, { basePath: 'planets/1' }),
                     [{ op: 'add', path: 'planets/1/id', value: 12345 }]);

    a = { name: 'Jupiter', classification: 'gas giant' };
    b = { id: { a: '1', b: '2' }, name: 'Jupiter', classification: 'gas giant' };

    assert.deepEqual(diffs(a, b, { basePath: 'planets/1' }),
                     [{ op: 'add', path: 'planets/1/id', value: { a: '1', b: '2' } }]);
  });

  test('#diffs generates `remove` patches when comparing two objects (as per rfc 6902)', function(assert) {
    var a, b;

    // RFC 6902 - Appendix A.4. Removing an Array Element
    a = { foo: ['bar', 'qux', 'baz'] };
    b = { foo: ['bar', 'baz'] };

    assert.deepEqual(diffs(a, b),
                     [{ op: 'remove', path: '/foo/1' }]);

    // Misc tests
    a = { id: 12345, name: 'Jupiter', classification: 'gas giant' };
    b = { name: 'Jupiter', classification: 'gas giant' };

    assert.deepEqual(diffs(a, b, { basePath: 'planets/1' }),
                     [{ op: 'remove', path: 'planets/1/id' }]);
  });

  test('#diffs generates `replace` patches when comparing two objects (as per rfc 6902)', function(assert) {
    var a, b;

    // RFC 6902 - Appendix A.5. Replacing a Value
    a = { foo: 'bar', baz: 'qux' };
    b = { foo: 'bar', baz: 'boo' };

    assert.deepEqual(diffs(a, b),
                     [{ op: 'replace', path: '/baz', 'value': 'boo' }]);

    // Misc tests
    a = { id: { a: '1', b: '2' }, name: 'Jupiter', classification: 'gas giant' };
    b = { id: { a: '1', b: '3' }, name: 'Jupiter', classification: 'gas giant' };

    assert.deepEqual(diffs(a, b, { basePath: 'planets/1' }),
                     [{ op: 'replace', path: 'planets/1/id/b', value: '3' }]);

    a = { id: { a: '1', b: '2' }, name: 'Jupiter', classification: 'gas giant' };
    b = { id: { a: '1', b: '3' }, name: 'Earth', classification: 'terrestrial' };

    assert.deepEqual(diffs(a, b, { basePath: 'planets/1' }),
                     [{ op: 'replace', path: 'planets/1/id/b', value: '3' },
                      { op: 'replace', path: 'planets/1/name', value: 'Earth' },
                      { op: 'replace', path: 'planets/1/classification', value: 'terrestrial' }]);
  });

  test('#diffs ignores specified items with `ignore` option', function(assert) {
    var a, b;

    a = { id: { a: '1', b: '2' }, name: 'Jupiter', classification: 'gas giant' };
    b = { id: { a: '1', b: '3' }, name: 'Saturn', classification: 'gas giant' };

    assert.deepEqual(diffs(a, b, { basePath: 'planets/1', ignore: ['id'] }),
                     [{ op: 'replace', path: 'planets/1/name', value: 'Saturn' }],
                      'specified items are ignored in delta');
  });

  test('#diffs generates `replace` patch when comparing two dates', function(assert) {
    let a = new Date(1428555600000);
    let b = new Date(1428555601000);

    assert.deepEqual(diffs(a, b, { basePath: 'planets/1/birthDate' }),
                     [{ op: 'replace', path: 'planets/1/birthDate', value: b }],
                     'dates are replaced');
  });

  test('#diffs generates undefined patch when comparing two equal dates', function(assert) {
    let a = new Date(1428555600000);
    let b = new Date(1428555600000);

    assert.deepEqual(diffs(a, b, { basePath: 'planets/1/birthDate' }),
                     undefined,
                     'dates are the same');
  });

  test('#diffs generates `replace` patch when string is replaced by a date', function(assert) {
    let a = 'string';
    let b = new Date(1428555600000);

    assert.deepEqual(diffs(a, b, { basePath: 'planets/1/birthDate' }),
                     [{ op: 'replace', path: 'planets/1/birthDate', value: b }],
                     'string was replaced by date');
  });

  test('#diffs generates `replace` patch when date is replaced by a string', function(assert) {
    let a = new Date(1428555600000);
    let b = 'string';

    assert.deepEqual(diffs(a, b, { basePath: 'planets/1/birthDate' }),
                     [{ op: 'replace', path: 'planets/1/birthDate', value: b }],
                     'date was replaced by string');
  });
});
