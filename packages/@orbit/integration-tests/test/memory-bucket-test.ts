import { Schema } from '@orbit/data';
import { MemorySource } from '@orbit/memory';
import { IndexedDBBucket } from '@orbit/indexeddb-bucket';

const { module, test } = QUnit;

module('MemorySource + IndexdDBBucket', function (hooks) {
  let schema: Schema;
  let bucket: IndexedDBBucket;
  let memory: MemorySource;

  hooks.beforeEach(() => {
    schema = new Schema({
      models: {
        moon: {
          attributes: {
            name: { type: 'string' }
          }
        }
      }
    });

    bucket = new IndexedDBBucket({ namespace: 'my-app' });
    memory = new MemorySource({
      bucket,
      schema
    });
  });

  hooks.afterEach(() => {
    bucket.deleteDB();
    schema = memory = bucket = null;
  });

  test('push before pull', async function (assert) {
    const theMoon = {
      id: undefined as any,
      type: 'moon',
      attributes: {
        name: 'The Moon'
      }
    };

    await memory.update((t) => t.addRecord(theMoon));
    assert.ok(true);
  });
});
