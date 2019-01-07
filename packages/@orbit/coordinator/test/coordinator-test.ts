import Coordinator, { Strategy, CoordinatorOptions, ActivationOptions } from '../src/index';
import { Source } from '@orbit/data';

const { module, test } = QUnit;

module('Coordinator', function(hooks) {
  class MySource extends Source {}
  class MyStrategy extends Strategy {}

  let coordinator: Coordinator;

  test('can be instantiated', function(assert) {
    coordinator = new Coordinator();

    assert.ok(coordinator);
  });

  test('can add sources', function(assert) {
    let s1 = new MySource({ name: 's1' });
    let s2 = new MySource({ name: 's2' });
    let s3 = new MySource({ name: 's3' });

    coordinator = new Coordinator({ sources: [s1, s2] });
    assert.deepEqual(coordinator.sources, [s1, s2]);

    coordinator.addSource(s3);
    assert.deepEqual(coordinator.sources, [s1, s2, s3]);
    assert.deepEqual(coordinator.sourceNames, ['s1', 's2', 's3']);

    assert.strictEqual(coordinator.getSource('s1'), s1);
    assert.strictEqual(coordinator.getSource('s2'), s2);
    assert.strictEqual(coordinator.getSource('s3'), s3);
  });

  test('can not add a source without a name', function(assert) {
    let s1 = new MySource();
    coordinator = new Coordinator();

    assert.throws(
      () => {
        coordinator.addSource(s1);
      },
      new Error("Assertion failed: Sources require a 'name' to be added to a coordinator.")
    );
  });

  test('can not add a source with a duplicate name', function(assert) {
    let s1 = new MySource({ name: 's1' });
    let s2 = new MySource({ name: 's1' });
    coordinator = new Coordinator();

    assert.throws(
      () => {
        coordinator.addSource(s1);
        coordinator.addSource(s2);
      },
      new Error("Assertion failed: A source named 's1' has already been added to this coordinator.")
    );
  });

  test('can not add a source while activated', async function(assert) {
    let s1 = new MySource({ name: 's1' });
    coordinator = new Coordinator();

    await coordinator.activate();

    assert.throws(
      () => {
        coordinator.addSource(s1);
      },
      new Error("Assertion failed: A coordinator's sources can not be changed while it is active.")
    );
  });

  test('can not remove a source while activated', async function(assert) {
    let s1 = new MySource({ name: 's1' });
    coordinator = new Coordinator({ sources: [s1] });

    await coordinator.activate();

    assert.throws(
      () => {
        coordinator.removeSource('s1');
      },
      new Error("Assertion failed: A coordinator's sources can not be changed while it is active.")
    );
  });

  test('can not remove a source that has not been added', async function(assert) {
    let s1 = new MySource({ name: 's1' });
    coordinator = new Coordinator();

    await coordinator.activate();

    assert.throws(
      () => {
        coordinator.removeSource('s1');
      },
      new Error("Assertion failed: Source 's1' has not been added to this coordinator.")
    );
  });

  test('can remove a source while inactive', function(assert) {
    let s1 = new MySource({ name: 's1' });
    let s2 = new MySource({ name: 's2' });
    let s3 = new MySource({ name: 's3' });

    coordinator = new Coordinator({ sources: [s1, s2, s3] });
    assert.deepEqual(coordinator.sources, [s1, s2, s3]);

    coordinator.removeSource('s2');
    assert.deepEqual(coordinator.sources, [s1, s3]);
  });

  test('can add strategies', function(assert) {
    let s1 = new MyStrategy({ name: 's1' });
    let s2 = new MyStrategy({ name: 's2' });
    let s3 = new MyStrategy({ name: 's3' });

    coordinator = new Coordinator({ strategies: [s1, s2] });
    assert.deepEqual(coordinator.strategies, [s1, s2]);

    coordinator.addStrategy(s3);
    assert.deepEqual(coordinator.strategies, [s1, s2, s3]);
    assert.deepEqual(coordinator.strategyNames, ['s1', 's2', 's3']);

    assert.strictEqual(coordinator.getStrategy('s1'), s1);
    assert.strictEqual(coordinator.getStrategy('s2'), s2);
    assert.strictEqual(coordinator.getStrategy('s3'), s3);
  });

  test('can not add a strategy with a duplicate name', function(assert) {
    let s1 = new MyStrategy({ name: 's1' });
    let s2 = new MyStrategy({ name: 's1' });
    coordinator = new Coordinator();

    assert.throws(
      () => {
        coordinator.addStrategy(s1);
        coordinator.addStrategy(s2);
      },
      new Error("Assertion failed: A strategy named 's1' has already been added to this coordinator.")
    );
  });

  test('can not add a strategy while activated', async function(assert) {
    let s1 = new MyStrategy({ name: 's1' });
    coordinator = new Coordinator();

    await coordinator.activate();

    assert.throws(
      () => {
        coordinator.addStrategy(s1);
      },
      new Error("Assertion failed: A coordinator's strategies can not be changed while it is active.")
    );
  });

  test('can not remove a strategy while activated', async function(assert) {
    let s1 = new MyStrategy({ name: 's1' });
    coordinator = new Coordinator({ strategies: [s1] });

    await coordinator.activate();

    assert.throws(
      () => {
        coordinator.removeStrategy('s1');
      },
      new Error("Assertion failed: A coordinator's strategies can not be changed while it is active.")
    );
  });

  test('can not remove a strategy that has not been added', async function(assert) {
    let s1 = new MyStrategy({ name: 's1' });
    coordinator = new Coordinator();

    await coordinator.activate();

    assert.throws(
      () => {
        coordinator.removeStrategy('s1');
      },
      new Error("Assertion failed: Strategy 's1' has not been added to this coordinator.")
    );
  });

  test('can remove a strategy while inactive', function(assert) {
    let s1 = new MyStrategy({ name: 's1' });
    let s2 = new MyStrategy({ name: 's2' });
    let s3 = new MyStrategy({ name: 's3' });

    coordinator = new Coordinator({ strategies: [s1, s2, s3] });
    assert.deepEqual(coordinator.strategies, [s1, s2, s3]);

    coordinator.removeStrategy('s2');
    assert.deepEqual(coordinator.strategies, [s1, s3]);
  });

  test('can be activated and deactivated', async function(assert) {
    assert.expect(10);

    let activatedCount = 0;
    let deactivatedCount = 0;

    class CustomStrategy extends Strategy {
      async activate(coordinator: Coordinator, options: ActivationOptions): Promise<void> {
        activatedCount++;
        if (activatedCount === 1) {
          assert.strictEqual(this.name, 's2', 'expected order');
        } else if (activatedCount === 2) {
          assert.strictEqual(this.name, 's1', 'expected order');
        } else if (activatedCount === 3) {
          assert.strictEqual(this.name, 's3', 'expected order');
        }
      }

      async deactivate(): Promise<void> {
        deactivatedCount++;
        if (deactivatedCount === 1) {
          assert.strictEqual(this.name, 's3', 'expected reverse order');
        } else if (deactivatedCount === 2) {
          assert.strictEqual(this.name, 's1', 'expected reverse order');
        } else if (deactivatedCount === 3) {
          assert.strictEqual(this.name, 's2', 'expected reverse order');
        }
      }
    }

    let s1 = new CustomStrategy({ name: 's1' });
    let s2 = new CustomStrategy({ name: 's2' });
    let s3 = new CustomStrategy({ name: 's3' });

    coordinator = new Coordinator({ strategies: [s2, s1] });
    coordinator.addStrategy(s3);

    await coordinator.activate();

    assert.equal(activatedCount, 3, 'both strategies have been activated');
    assert.equal(deactivatedCount, 0, 'no strategies have been deactivated');

    await coordinator.deactivate();

    assert.equal(activatedCount, 3, 'activated count has not changed');
    assert.equal(deactivatedCount, 3, 'both strategies have been deactivated');
  });

  test('can be deactivated multiple times, without being activated', async function(assert) {
    assert.expect(2);

    class CustomStrategy extends Strategy {
      async activate(coordinator: Coordinator, options: ActivationOptions): Promise<void> {
        assert.ok(false, 'strategies should not be activated');
      }

      async deactivate(): Promise<void> {
        assert.ok(false, 'strategies should not be deactivated');
      }
    }

    let s1 = new CustomStrategy({ name: 's1' });
    let s2 = new CustomStrategy({ name: 's2' });
    let s3 = new CustomStrategy({ name: 's3' });

    coordinator = new Coordinator({ strategies: [s2, s1] });
    coordinator.addStrategy(s3);

    await coordinator.deactivate();

    assert.ok(true, 'deactivate completes despite not being active');

    await coordinator.deactivate();

    assert.ok(true, 'deactivate can continue to be called');
  });
});
