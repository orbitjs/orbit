import { Coordinator, ActivationOptions, LogLevel } from '../src/coordinator';
import { Strategy, StrategyOptions } from '../src/strategy';
import { Source } from '@orbit/data';

const { module, test } = QUnit;

module('Strategy', function (hooks) {
  class MySource extends Source {}

  let coordinator: Coordinator;
  let strategy: Strategy;
  let s1: MySource;
  let s2: MySource;
  let s3: MySource;

  hooks.beforeEach(function () {
    s1 = new MySource({ name: 's1' });
    s2 = new MySource({ name: 's2' });
    s3 = new MySource({ name: 's3' });

    coordinator = new Coordinator({ sources: [s1, s2, s3] });
  });

  test('can be instantiated with a name', function (assert) {
    class CustomStrategy extends Strategy {}

    strategy = new CustomStrategy({
      name: 'custom'
    });

    assert.ok(strategy);
  });

  test('requires a name', function (assert) {
    class CustomStrategy extends Strategy {}

    assert.throws(
      function () {
        strategy = new CustomStrategy();
      },
      Error('Assertion failed: Strategy requires a name'),
      'assertion raised'
    );
  });

  test('uses its name as the basis for a logPrefix', function (assert) {
    class CustomStrategy extends Strategy {}

    strategy = new CustomStrategy({
      name: 'custom'
    });

    assert.equal(strategy.logPrefix, '[custom]');
  });

  test('can specify a custom logPrefix', function (assert) {
    class CustomStrategy extends Strategy {}

    strategy = new CustomStrategy({
      name: 'custom',
      logPrefix: '[foo-bar]'
    });

    assert.equal(strategy.logPrefix, '[foo-bar]');
  });

  test('applies to all sources by default', async function (assert) {
    assert.expect(1);

    class CustomStrategy extends Strategy {
      constructor(options: StrategyOptions = {}) {
        options.name = 'custom';
        super(options);
      }

      async activate(
        coordinator: Coordinator,
        options: ActivationOptions = {}
      ): Promise<void> {
        await super.activate(coordinator, options);
        assert.deepEqual(this._sources, [s1, s2, s3]);
      }
    }

    strategy = new CustomStrategy();

    await strategy.activate(coordinator);
  });

  test('can include only specific sources', async function (assert) {
    assert.expect(1);

    class CustomStrategy extends Strategy {
      constructor(options: StrategyOptions = {}) {
        options.name = 'custom';
        super(options);
      }

      async activate(
        coordinator: Coordinator,
        options: ActivationOptions = {}
      ): Promise<void> {
        await super.activate(coordinator, options);
        assert.deepEqual(this._sources, [s1, s2]);
      }
    }

    strategy = new CustomStrategy({ sources: ['s1', 's2'] });

    await strategy.activate(coordinator);
  });

  test('#activate - receives the `logLevel` from the coordinator', async function (assert) {
    assert.expect(2);

    class CustomStrategy extends Strategy {
      constructor(options: StrategyOptions = {}) {
        options.name = 'custom';
        super(options);

        assert.equal(
          this.logLevel,
          undefined,
          '_logLevel is initially undefined'
        );
      }

      async activate(
        coordinator: Coordinator,
        options: ActivationOptions = {}
      ): Promise<void> {
        await super.activate(coordinator, options);
        assert.equal(
          this.logLevel,
          LogLevel.Warnings,
          '_logLevel is set by activate'
        );
      }
    }

    strategy = new CustomStrategy();
    coordinator.addStrategy(strategy);

    await coordinator.activate({ logLevel: LogLevel.Warnings });
  });

  test('a custom `logLevel` will override the level from the coordinator', async function (assert) {
    assert.expect(2);

    class CustomStrategy extends Strategy {
      constructor(options: StrategyOptions = {}) {
        options.name = 'custom';
        super(options);

        assert.equal(this.logLevel, LogLevel.Errors, '_logLevel is custom');
      }

      async activate(
        coordinator: Coordinator,
        options: ActivationOptions = {}
      ): Promise<void> {
        await super.activate(coordinator, options);
        assert.equal(
          this.logLevel,
          LogLevel.Errors,
          '_logLevel is custom even after activate'
        );
      }
    }

    strategy = new CustomStrategy({ logLevel: LogLevel.Errors });
    coordinator.addStrategy(strategy);

    await coordinator.activate({ logLevel: LogLevel.Warnings });
  });

  test('activate sources', async function (assert) {
    class CustomStrategy extends Strategy {}

    strategy = new CustomStrategy({
      name: 'custom',
      sources: ['s1', 's2', 's3']
    });

    assert.equal(strategy.sources.length, 0, 'no sources activated');

    coordinator.addStrategy(strategy);
    await coordinator.activate();

    assert.equal(strategy.sources.length, 3, '3 sources activated');

    assert.ok(strategy.sources.map((s) => s.activated));

    await coordinator.deactivate();
  });
});
