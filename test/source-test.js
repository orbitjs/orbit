import Source from '../src/source';
import Transform from '../src/transform';
import { isEvented } from '../src/evented';
import { FakeBucket } from './test-helper';

const { module, test } = QUnit;

module('Source', function() {
  let source;

  test('it can be instantiated', function(assert) {
    source = new Source({ name: 'src1' });
    assert.ok(source);
    assert.ok(source.transformLog, 'has a transform log');
  });

  test('it requires a name', function(assert) {
    assert.throws(function() {
      source = new Source();
    },
    Error('Assertion failed: Source requires a name'),
    'assertion raised');
  });

  test('it should mixin Evented', function(assert) {
    source = new Source({ name: 'src1' });
    assert.ok(isEvented(source), 'Source is evented');
  });

  test('creates a `transformLog`, `requestQueue`, and `syncQueue`, and assigns each the same bucket as the Source', function(assert) {
    assert.expect(8);
    const bucket = new FakeBucket({ name: 'fake-bucket' });
    source = new Source({ name: 'src1', bucket });
    assert.equal(source.name, 'src1', 'source has been assigned name');
    assert.equal(source.transformLog.name, 'src1-log', 'transformLog has been assigned name');
    assert.equal(source.requestQueue.name, 'src1-requests', 'requestQueue has been assigned name');
    assert.equal(source.syncQueue.name, 'src1-sync', 'syncQueue has been assigned name');
    assert.strictEqual(source.bucket, bucket, 'source has been assigned bucket');
    assert.strictEqual(source.transformLog.bucket, bucket, 'transformLog has been assigned bucket');
    assert.strictEqual(source.requestQueue.bucket, bucket, 'requestQueue has been assigned bucket');
    assert.strictEqual(source.syncQueue.bucket, bucket, 'syncQueue has been assigned bucket');
  });

  test('#_transformed should trigger `transform` event BEFORE resolving', function(assert) {
    assert.expect(3);

    source = new Source({ name: 'src1' });
    let order = 0;
    const appliedTransform = Transform.from({ op: 'addRecord', value: {} });

    source.on('transform', (transform) => {
      assert.equal(++order, 1, '`transform` event triggered after action performed successfully');
      assert.strictEqual(transform, appliedTransform, 'applied transform matches');
    });

    return source._transformed([appliedTransform])
      .then(() => {
        assert.equal(++order, 2, '_transformed promise resolved last');
      });
  });

  test('#transformLog contains transforms applied', function(assert) {
    assert.expect(2);

    source = new Source({ name: 'src1' });
    const appliedTransform = Transform.from({ op: 'addRecord', value: {} });

    assert.ok(!source.transformLog.contains(appliedTransform.id));

    return source
      ._transformed([appliedTransform])
      .then(() => assert.ok(source.transformLog.contains(appliedTransform.id)));
  });
});
