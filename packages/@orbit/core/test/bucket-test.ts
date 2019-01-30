import { Bucket } from '../src/bucket';

const { module, test } = QUnit;

module('Bucket', function() {
  // Extend Bucket because it's an abstract class
  class MyBucket extends Bucket {
    constructor(settings = {}) { super(settings); }

    getItem(key: string): Promise<any> { return Promise.resolve(); }
    setItem(key: string, value: any): Promise<void> { return Promise.resolve(); }
    removeItem(key: string): Promise<void> { return Promise.resolve(); }
  }

  test('can be instantiated', function(assert) {
    let bucket = new MyBucket();
    assert.ok(bucket, 'bucket exists');
  });

  test('has a default namespace and version', function(assert) {
    let bucket = new MyBucket();
    assert.equal(bucket.namespace, 'orbit-bucket', 'default namespace');
    assert.equal(bucket.version, 1, 'default version');
  });

  test('can be instantiated with a name, namespace, and version', function(assert) {
    let bucket = new MyBucket({
      name: 'my-bucket',
      namespace: 'app-settings',
      version: 1
    });
    assert.equal(bucket.name, 'my-bucket', 'name matches');
    assert.equal(bucket.namespace, 'app-settings', 'namespace matches');
    assert.equal(bucket.version, 1, 'version matches');
  });

  test('can be upgraded to a new version', function(assert) {
    const done = assert.async();

    assert.expect(5);

    let bucket = new MyBucket({
      name: 'my-bucket',
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
