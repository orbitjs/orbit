import Operation from 'orbit/operation';
import { toOperation, normalizeOperation, normalizeOperations } from 'orbit/lib/operations';
import { equalOps } from 'tests/test-helper';

module('Orbit - Lib - Operations', {});

test('toOperation - creates an Operation from `op`, `path`, and `value` arguments', function() {
  equalOps(
    toOperation('add',
                ['planet', 'planet1'],
                { type: 'planet', id: 'planet1', attributes: { name: 'Europa' } }),
    new Operation({ op: 'add', path: ['planet', 'planet1'], value: { type: 'planet', id: 'planet1', attributes: { name: 'Europa' } } })
  );
});

test('normalizeOperation - can create an Operation from an object', function() {
  var raw = { op: 'add', path: 'planet', value: {} };
  var normalized = normalizeOperation(raw);
  ok(normalized instanceof Operation, 'operation has been normalized');
  equal(normalized.op, raw.op, 'op matches');
  equal(normalized.path, raw.path, 'path matches');
  equal(normalized.value, raw.value, 'value matches');
});

test('normalizeOperation - can create an Operation from an object', function() {
  var raw = [{ op: 'add', path: 'planet', value: {} },
             new Operation({ op: 'add', path: 'moon', value: {} })];
  var normalized = normalizeOperations(raw);
  ok(normalized[0] instanceof Operation, 'operation has been normalized');
  ok(normalized[1] instanceof Operation, 'operation is still normalized');
  notStrictEqual(normalized[0], raw[0], 'operation has changed');
  equal(normalized[0].op, raw[0].op, 'op matches');
  equal(normalized[0].path, raw[0].path, 'path matches');
  equal(normalized[0].value, raw[0].value, 'value matches');
  strictEqual(normalized[1], raw[1], 'operation hasn\'t changed');
});
