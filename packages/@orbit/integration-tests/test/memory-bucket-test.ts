import { RecordSchema } from '@orbit/records';
import { MemorySource } from '@orbit/memory';
import { IndexedDBBucket } from '@orbit/indexeddb-bucket';

const { module, test } = QUnit;

module('MemorySource + IndexdDBBucket', function (hooks) {
  let schema: RecordSchema;
  let bucket: IndexedDBBucket;
  let memory: MemorySource;

  hooks.beforeEach(() => {
    schema = new RecordSchema({
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
  });

  test('push before pull', async function (assert) {
    const theMoon = {
      type: 'moon',
      attributes: {
        name: 'The Moon'
      }
    };

    await memory.update((t) => t.addRecord(theMoon));
    assert.ok(true);
  });
});
