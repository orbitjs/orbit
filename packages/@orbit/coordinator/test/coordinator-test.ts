import { Coordinator, ActivationOptions } from '../src/coordinator';
import { Strategy } from '../src/strategy';
import { Source } from '@orbit/data';

const { module, test } = QUnit;

module('Coordinator', function (hooks) {
  class MySource extends Source {}
  class MyStrategy extends Strategy {}

  let coordinator: Coordinator;

  test('can be instantiated', function (assert) {
    coordinator = new Coordinator();

    assert.ok(coordinator);
  });

  test('can add sources', function (assert) {
    let s1 = new MySource({ name: 's1' });
    let s2 = new MySource({ name: 's2' });
    let s3 = new MySource({ name: 's3' });

    coordinator = new Coordinator({ sources: [s1, s2] });
    assert.deepEqual(coordinator.sources, [s1, s2]);

    coordinator.addSource(s3);
    assert.deepEqual(coordinator.sources, [s1, s2, s3]);
    assert.deepEqual(coordinator.sourceNames, ['s1', 's2', 's3']);

    assert.strictEqual(coordinator.getSource<MySource>('s1'), s1);
    assert.strictEqual(coordinator.getSource<MySource>('s2'), s2);
    assert.strictEqual(coordinator.getSource<MySource>('s3'), s3);
  });

  test('can not add a source without a name', function (assert) {
    let s1 = new MySource();
    coordinator = new Coordinator();

    assert.throws(() => {
      coordinator.addSource(s1);
    }, new Error("Assertion failed: Sources require a 'name' to be added to a coordinator."));
  });

  test('can not add a source with a duplicate name', function (assert) {
    let s1 = new MySource({ name: 's1' });
    let s2 = new MySource({ name: 's1' });
    coordinator = new Coordinator();

    assert.throws(() => {
      coordinator.addSource(s1);
      coordinator.addSource(s2);
    }, new Error("Assertion failed: A source named 's1' has already been added to this coordinator."));
  });

  test('can not add a source while activated', async function (assert) {
    let s1 = new MySource({ name: 's1' });
    coordinator = new Coordinator();

    await coordinator.activate();

    assert.throws(() => {
      coordinator.addSource(s1);
    }, new Error("Assertion failed: A coordinator's sources can not be changed while it is active."));
  });

  test('can not remove a source while activated', async function (assert) {
    let s1 = new MySource({ name: 's1' });
    coordinator = new Coordinator({ sources: [s1] });

    await coordinator.activate();

    assert.throws(() => {
      coordinator.removeSource('s1');
    }, new Error("Assertion failed: A coordinator's sources can not be changed while it is active."));
  });

  test('can not remove a source that has not been added', async function (assert) {
    let s1 = new MySource({ name: 's1' });
    coordinator = new Coordinator();

    await coordinator.activate();

    assert.throws(() => {
      coordinator.removeSource('s1');
    }, new Error("Assertion failed: Source 's1' has not been added to this coordinator."));
  });

  test('can remove a source while inactive', function (assert) {
    let s1 = new MySource({ name: 's1' });
    let s2 = new MySource({ name: 's2' });
    let s3 = new MySource({ name: 's3' });

    coordinator = new Coordinator({ sources: [s1, s2, s3] });
    assert.deepEqual(coordinator.sources, [s1, s2, s3]);

    coordinator.removeSource('s2');
    assert.deepEqual(coordinator.sources, [s1, s3]);
  });

  test('can add strategies', function (assert) {
    let s1 = new MyStrategy({ name: 's1' });
    let s2 = new MyStrategy({ name: 's2' });
    let s3 = new MyStrategy({ name: 's3' });

    coordinator = new Coordinator({ strategies: [s1, s2] });
    assert.deepEqual(coordinator.strategies, [s1, s2]);

    coordinator.addStrategy(s3);
    assert.deepEqual(coordinator.strategies, [s1, s2, s3]);
    assert.deepEqual(coordinator.strategyNames, ['s1', 's2', 's3']);

    assert.strictEqual(coordinator.getStrategy<MyStrategy>('s1'), s1);
    assert.strictEqual(coordinator.getStrategy<MyStrategy>('s2'), s2);
    assert.strictEqual(coordinator.getStrategy<MyStrategy>('s3'), s3);
  });

  test('can not add a strategy with a duplicate name', function (assert) {
    let s1 = new MyStrategy({ name: 's1' });
    let s2 = new MyStrategy({ name: 's1' });
    coordinator = new Coordinator();

    assert.throws(() => {
      coordinator.addStrategy(s1);
      coordinator.addStrategy(s2);
    }, new Error("Assertion failed: A strategy named 's1' has already been added to this coordinator."));
  });

  test('can not add a strategy while activated', async function (assert) {
    let s1 = new MyStrategy({ name: 's1' });
    coordinator = new Coordinator();

    await coordinator.activate();

    assert.throws(() => {
      coordinator.addStrategy(s1);
    }, new Error("Assertion failed: A coordinator's strategies can not be changed while it is active."));
  });

  test('can not remove a strategy while activated', async function (assert) {
    let s1 = new MyStrategy({ name: 's1' });
    coordinator = new Coordinator({ strategies: [s1] });

    await coordinator.activate();

    assert.throws(() => {
      coordinator.removeStrategy('s1');
    }, new Error("Assertion failed: A coordinator's strategies can not be changed while it is active."));
  });

  test('can not remove a strategy that has not been added', async function (assert) {
    let s1 = new MyStrategy({ name: 's1' });
    coordinator = new Coordinator();

    await coordinator.activate();

    assert.throws(() => {
      coordinator.removeStrategy('s1');
    }, new Error("Assertion failed: Strategy 's1' has not been added to this coordinator."));
  });

  test('can remove a strategy while inactive', function (assert) {
    let s1 = new MyStrategy({ name: 's1' });
    let s2 = new MyStrategy({ name: 's2' });
    let s3 = new MyStrategy({ name: 's3' });

    coordinator = new Coordinator({ strategies: [s1, s2, s3] });
    assert.deepEqual(coordinator.strategies, [s1, s2, s3]);

    coordinator.removeStrategy('s2');
    assert.deepEqual(coordinator.strategies, [s1, s3]);
  });

  test('can be activated and deactivated', async function (assert) {
    assert.expect(31);

    let activatedCount = 0;
    let bsaCount = 0;
    let asaCount = 0;

    let deactivatedCount = 0;
    let bsdCount = 0;
    let asdCount = 0;

    class CustomSource extends Source {
      async activate() {
        assert.equal(
          bsaCount,
          3,
          'source.activate - beforeSourceActivation has already been invoked for all strategies'
        );
        assert.equal(
          asaCount,
          0,
          'source.activate - afterSourceActivation has not been invoked for any strategies'
        );

        await super.activate();
      }

      async deactivate() {
        assert.equal(
          bsdCount,
          3,
          'source.deactivate - beforeSourceDeactivation has already been invoked for all strategies'
        );
        assert.equal(
          asdCount,
          0,
          'source.deactivate - afterSourceDectivation has not been invoked for any strategies'
        );

        await super.deactivate();
      }
    }

    class CustomStrategy extends Strategy {
      async activate(
        coordinator: Coordinator,
        options: ActivationOptions
      ): Promise<void> {
        activatedCount++;
        if (activatedCount === 1) {
          assert.equal(
            bsaCount,
            0,
            'strategy.activate - beforeSourceActivation has not yet been invoked'
          );
          assert.strictEqual(
            this.name,
            's2',
            'strategy.activate - expected order'
          );
        } else if (activatedCount === 2) {
          assert.strictEqual(
            this.name,
            's1',
            'strategy.activate - expected order'
          );
        } else if (activatedCount === 3) {
          assert.strictEqual(
            this.name,
            's3',
            'strategy.activate - expected order'
          );
        }
      }

      async deactivate(): Promise<void> {
        deactivatedCount++;

        if (deactivatedCount === 1) {
          assert.equal(
            bsdCount,
            3,
            'strategy.deactivate - beforeSourceDeactivation has already been invoked for all strategies'
          );
          assert.equal(
            asdCount,
            3,
            'strategy.deactivate - afterSourceDeactivation has already been invoked for all strategies'
          );

          assert.strictEqual(
            this.name,
            's3',
            'strategy.deactivate - expected reverse order'
          );
        } else if (deactivatedCount === 2) {
          assert.strictEqual(
            this.name,
            's1',
            'strategy.deactivate - expected reverse order'
          );
        } else if (deactivatedCount === 3) {
          assert.strictEqual(
            this.name,
            's2',
            'strategy.deactivate - expected reverse order'
          );
        }
      }

      async beforeSourceActivation(): Promise<void> {
        bsaCount++;
        if (bsaCount === 1) {
          assert.strictEqual(
            this.name,
            's2',
            'strategy.beforeSourceActivation - expected order'
          );
        } else if (bsaCount === 2) {
          assert.strictEqual(
            this.name,
            's1',
            'strategy.beforeSourceActivation - expected order'
          );
        } else if (bsaCount === 3) {
          assert.strictEqual(
            this.name,
            's3',
            'strategy.beforeSourceActivation - expected order'
          );
        }
      }

      async afterSourceActivation(): Promise<void> {
        asaCount++;
        if (asaCount === 1) {
          assert.strictEqual(
            this.name,
            's2',
            'strategy.afterSourceActivation - expected order'
          );
        } else if (asaCount === 2) {
          assert.strictEqual(
            this.name,
            's1',
            'strategy.afterSourceActivation - expected order'
          );
        } else if (asaCount === 3) {
          assert.strictEqual(
            this.name,
            's3',
            'strategy.afterSourceActivation - expected order'
          );
        }
      }

      async beforeSourceDeactivation(): Promise<void> {
        bsdCount++;
        if (bsdCount === 1) {
          assert.strictEqual(
            this.name,
            's3',
            'strategy.beforeSourceDeactivation - expected reverse order'
          );
        } else if (bsdCount === 2) {
          assert.strictEqual(
            this.name,
            's1',
            'strategy.beforeSourceDeactivation - expected reverse order'
          );
        } else if (bsdCount === 3) {
          assert.strictEqual(
            this.name,
            's2',
            'strategy.beforeSourceDeactivation - expected reverse order'
          );
        }
      }

      async afterSourceDeactivation(): Promise<void> {
        asdCount++;
        if (asdCount === 1) {
          assert.strictEqual(
            this.name,
            's3',
            'strategy.afterSourceDeactivation - expected reverse order'
          );
        } else if (asdCount === 2) {
          assert.strictEqual(
            this.name,
            's1',
            'strategy.afterSourceDeactivation - expected reverse order'
          );
        } else if (asdCount === 3) {
          assert.strictEqual(
            this.name,
            's2',
            'strategy.afterSourceDeactivation - expected reverse order'
          );
        }
      }
    }

    let s1 = new CustomStrategy({ name: 's1' });
    let s2 = new CustomStrategy({ name: 's2' });
    let s3 = new CustomStrategy({ name: 's3' });
    let source1 = new CustomSource({ name: 'source1', autoActivate: false });

    coordinator = new Coordinator({ strategies: [s2, s1], sources: [source1] });
    coordinator.addStrategy(s3);

    await coordinator.activate();

    assert.equal(
      asaCount,
      3,
      'afterSourceActivation has been invoked for all strategies'
    );

    assert.equal(activatedCount, 3, 'all strategies have been activated');
    assert.equal(deactivatedCount, 0, 'no strategies have been deactivated');

    await coordinator.deactivate();

    assert.equal(
      asdCount,
      3,
      'afterSourceDeactivation has been invoked for all strategies'
    );

    assert.equal(activatedCount, 3, 'activated count has not changed');
    assert.equal(deactivatedCount, 3, 'all strategies have been deactivated');
  });

  test('can be deactivated multiple times, without being activated', async function (assert) {
    assert.expect(2);

    class CustomStrategy extends Strategy {
      async activate(
        coordinator: Coordinator,
        options: ActivationOptions
      ): Promise<void> {
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
