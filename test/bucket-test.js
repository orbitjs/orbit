import Bucket from '../src/bucket';

const { module, test } = QUnit;

module('Bucket', function() {
  test('can be instantiated', function(assert) {
    let bucket = new Bucket({ name: 'bucket' });
    assert.ok(bucket, 'bucket exists');
  });

  test('requires a name', function(assert) {
    assert.expect(1);
    assert.throws(function() {
      let bucket = new Bucket();
      assert.ok(!bucket, 'should not get here'); // added for linting
    },
    Error('Assertion failed: Bucket requires a name'),
    'assertion raised');
  });

  test('has a default namespace and version', function(assert) {
    let bucket = new Bucket({ name: 'bucket' });
    assert.equal(bucket.namespace, 'orbit-bucket', 'default namespace');
    assert.equal(bucket.version, 1, 'default version');
  });

  test('can be instantiated with a name, namespace, and version', function(assert) {
    let bucket = new Bucket({
      name: 'myBucket',
      namespace: 'app-settings',
      version: 1
    });
    assert.equal(bucket.name, 'myBucket', 'name matches');
    assert.equal(bucket.namespace, 'app-settings', 'namespace matches');
    assert.equal(bucket.version, 1, 'version matches');
  });

  test('can be upgraded to a new version', function(assert) {
    const done = assert.async();

    assert.expect(5);

    let bucket = new Bucket({
      name: 'myBucket',
      namespace: 'ns1',
      version: 1
    });
    assert.equal(bucket.namespace, 'ns1', 'namespace matches');
    assert.equal(bucket.version, 1, 'version matches');

    bucket.on('upgrade', (version) => {
      assert.equal(version, 2, 'version from upgrade event matches expectation');
    });

    bucket.upgrade({
      namespace: 'ns2',
      version: 2
    })
      .then(() => {
        assert.equal(bucket.namespace, 'ns2', 'namespace matches');
        assert.equal(bucket.version, 2, 'version matches');
        done();
      });
  });
});
