import TransformLog from 'orbit/transform/log';
import { TransformNotLoggedException, OutOfRangeException } from 'orbit/lib/exceptions';

module('Orbit - TransformLog', function() {
  const transformAId = 'f8d2c75f-f758-4314-b5c5-ac7fb783ab26';
  const transformBId = '1d12dc84-0d03-4875-a4a6-0e389737d891';
  const transformCId = 'ea054670-8901-45c2-b908-4db2c5bb9c7d';
  const transformDId = '771b25ff-b971-42e0-aac3-c285aef75326';
  let log;

  module('when empty', function(assert) {
    assert.beforeEach(function() {
      log = new TransformLog();
    });

    test('#length', function(assert) {
      assert.equal(log.length, 0, 'is zero');
    });

    test('#append', function(assert) {
      log.append(transformAId);
      assert.deepEqual(log.entries, [transformAId], 'adds transformId to log');
    });

    test('#head', function(assert) {
      assert.equal(log.head, null, 'is null');
    });
  });

  module('containing several transformIds', function(assert) {
    assert.beforeEach(function() {
      log = new TransformLog();

      log.append(transformAId);
      log.append(transformBId);
      log.append(transformCId);
    });

    test('#length', function(assert) {
      assert.equal(log.length, 3, 'reflects number of transforms that have been added');
    });

    test('#before', function(assert) {
      assert.deepEqual(log.before(transformCId), [transformAId, transformBId], 'includes transformIds preceding specified transformId');
    });

    test('#before - transformId that hasn\'t been logged', function(assert) {
      assert.throws(() => log.before(transformDId), TransformNotLoggedException);
    });

    test('#before - specifying a -1 relativePosition', function(assert) {
      assert.deepEqual(log.before(transformCId, -1), [transformAId], 'includes transformIds preceding specified transformId');
    });

    test('#before - specifying a relativePosition that is too low', function(assert) {
      assert.throws(() => log.before(transformCId, -3), OutOfRangeException);
    });

    test('#before - specifying a relativePosition that is too high', function(assert) {
      assert.throws(() => log.before(transformCId, 1), OutOfRangeException);
    });

    test('#after', function(assert) {
      assert.deepEqual(log.after(transformAId), [transformBId, transformCId], 'includes transformIds following specified transformId');
    });

    test('#after - transformId that hasn\'t been logged', function(assert) {
      assert.throws(() => log.after(transformDId), TransformNotLoggedException);
    });

    test('#after - specifying a +1 relativePosition', function(assert) {
      assert.deepEqual(log.after(transformAId, 1), [transformCId], 'includes transformIds following specified transformId');
    });

    test('#after - specifying a -1 relativePosition', function(assert) {
      assert.deepEqual(log.after(transformAId, -1), [transformAId, transformBId, transformCId], 'includes transformIds following specified transformId');
    });

    test('#after - head', function(assert) {
      log.after(log.head);
      assert.deepEqual(log.after(log.head), [], 'is empty');
    });

    test('#after - specifying a relativePosition that is too low', function(assert) {
      assert.throws(() => log.after(transformAId, -2), OutOfRangeException);
    });

    test('#after - specifying a relativePosition that is too high', function(assert) {
      assert.throws(() => log.after(transformCId, 1), OutOfRangeException);
    });

    test('#truncate', function(assert) {
      log.truncate(transformBId);
      assert.deepEqual(log.entries, [transformBId, transformCId], 'removes transformIds before specified transformId');
    });

    test('#truncate - to head', function(assert) {
      log.truncate(log.head);
      assert.deepEqual(log.entries, [transformCId], 'only head entry remains in log');
    });

    test('#truncate - just past head clears the log', function(assert) {
      log.truncate(transformCId, +1);
      assert.deepEqual(log.entries, [], 'clears log');
    });

    test('#truncate - to transformId that hasn\'t been logged', function(assert) {
      assert.throws(() => log.truncate(transformDId), TransformNotLoggedException);
    });

    test('#truncate - specifying a relativePosition that is too low', function(assert) {
      assert.throws(() => log.truncate(transformAId, -1), OutOfRangeException);
    });

    test('#truncate - specifying a relativePosition that is too high', function(assert) {
      assert.throws(() => log.truncate(transformCId, +2), OutOfRangeException);
    });

    test('#rollback', function(assert) {
      log.rollback(transformAId);
      assert.deepEqual(log.entries, [transformAId], 'removes transformIds after specified transformId');
    });

    test('#rollback - to head', function(assert) {
      log.rollback(log.head);
      assert.deepEqual(log.head, transformCId, 'doesn\'t change log');
    });

    test('#rollback - to transformId that hasn\'t been logged', function(assert) {
      assert.throws(() => log.rollback(transformDId), TransformNotLoggedException);
    });

    test('#rollback - to just before first', function(assert) {
      log.rollback(transformAId, -1);
      assert.deepEqual(log.entries, [], 'removes all entries');
    });

    test('#rollback - specifying a relativePosition that is too low', function(assert) {
      assert.throws(() => log.rollback(transformAId, -2), OutOfRangeException);
    });

    test('#rollback - specifying a relativePosition that is too high', function(assert) {
      assert.throws(() => log.rollback(transformCId, +1), OutOfRangeException);
    });


    test('#head', function(assert) {
      assert.equal(log.head, transformCId, 'is last transformId');
    });

    test('#contains', function(assert) {
      assert.ok(log.contains(transformAId), 'identifies when log contains a transform');
    });
  });
});
