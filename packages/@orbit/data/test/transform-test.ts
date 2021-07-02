import { buildTransform } from '../src/transform';
import { Operation } from '../src/operation';
import { OperationTerm } from '../src/operation-term';
import { RecordOperation, RecordTransformBuilder } from './support/record-data';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('buildTransform', function () {
  test('can instantiate a transform from an empty array of operations', function (assert) {
    let transform = buildTransform([]);
    assert.ok(transform);
  });

  test('can instantiate a transform that will be assigned an `id`', function (assert) {
    let transform = buildTransform([]);
    assert.ok(transform.id, 'transform has an id');
  });

  test('can instantiate a transform with a single operation, options, and an id', function (assert) {
    let operation = { op: 'addRecord' };
    let options = { sources: { jsonapi: { include: 'comments' } } };
    let id = 'abc123';

    let transform = buildTransform([operation], options, id);

    assert.strictEqual(transform.id, id, 'id was populated');
    assert.deepEqual(
      transform.operations,
      [operation],
      'operations was populated'
    );
    assert.strictEqual(transform.options, options, 'options was populated');
  });

  test('can instantiate a transform with an array of operations, options, and an id', function (assert) {
    let operations = [{ op: 'addRecord' }];
    let options = { sources: { jsonapi: { include: 'comments' } } };
    let id = 'abc123';

    let transform = buildTransform(operations, options, id);

    assert.strictEqual(transform.id, id, 'id was populated');
    assert.deepEqual(
      transform.operations,
      operations,
      'operations was populated'
    );
    assert.strictEqual(transform.options, options, 'options was populated');
  });

  test('can instantiate a transform with a single operation term, options, and an id', function (assert) {
    let term1 = {
      toOperation: () => {
        return { op: 'addRecord' };
      }
    } as OperationTerm<RecordOperation>;
    let options = { sources: { jsonapi: { include: 'comments' } } };
    let id = 'abc123';

    let transform = buildTransform([term1], options, id);

    assert.strictEqual(transform.id, id, 'id was populated');
    assert.deepEqual(
      transform.operations,
      [{ op: 'addRecord' }],
      'operations was populated'
    );
    assert.strictEqual(transform.options, options, 'options was populated');
  });

  test('can instantiate a transform with an array of operation terms, options, and an id', function (assert) {
    let term1 = {
      toOperation: () => {
        return { op: 'addRecord' };
      }
    } as OperationTerm<RecordOperation>;
    let term2 = {
      toOperation: () => {
        return { op: 'updateRecord' };
      }
    } as OperationTerm<RecordOperation>;
    let operations = [term1, term2];
    let options = { sources: { jsonapi: { include: 'comments' } } };
    let id = 'abc123';

    let transform = buildTransform(operations, options, id);

    assert.strictEqual(transform.id, id, 'id was populated');
    assert.deepEqual(
      transform.operations,
      [{ op: 'addRecord' }, { op: 'updateRecord' }],
      'operations was populated'
    );
    assert.strictEqual(transform.options, options, 'options was populated');
  });

  test('will return a transform passed into it', function (assert) {
    let transform = buildTransform([]);
    assert.strictEqual(buildTransform(transform), transform);
  });

  test('will return a new transform if a transform is passed as well as options / id', function (assert) {
    let term1 = {
      toOperation: () => {
        return { op: 'updateRecord' };
      }
    } as OperationTerm<RecordOperation>;
    let operations = [term1];
    let transform1 = buildTransform(operations, { a: '1', c: '1' }, '1');
    let transform2 = buildTransform(transform1, { a: '2', b: '2' }, '2');
    assert.notStrictEqual(transform1, transform2);
    assert.deepEqual(transform2, {
      operations: [
        {
          op: 'updateRecord'
        }
      ],
      options: {
        a: '2',
        b: '2',
        c: '1'
      },
      id: '2'
    });
  });

  test('will create a transform using a TransformBuilder if a function is passed into it', function (assert) {
    let tb = new RecordTransformBuilder();
    let planet = { type: 'planet', id: 'earth' };
    let operation = {
      op: 'addRecord',
      record: planet
    };

    let transform = buildTransform<Operation, RecordTransformBuilder>(
      (t) => t.addRecord(planet),
      undefined,
      undefined,
      tb
    );
    assert.deepEqual(
      transform.operations,
      operation,
      'operations was populated'
    );
  });
});
