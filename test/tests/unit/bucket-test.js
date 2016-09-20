import Bucket from 'orbit/bucket';

module('Unit | Bucket', function() {
  test('can be instantiated', function(assert) {
    let bucket = new Bucket();
    assert.ok(bucket, 'bucket exists');
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
});
