import Coordinator, {
  ActivationOptions,
  Strategy,
  StrategyOptions
} from '../src/index';
import Orbit, {
  Source,
  Transform,
  addRecord
} from '@orbit/data';
import './test-helper';

const { module, test } = QUnit;

module('Strategy', function(hooks) {
  class MySource extends Source {}

  let coordinator: Coordinator;
  let strategy: Strategy;
  let s1: MySource;
  let s2: MySource;
  let s3: MySource;

  hooks.beforeEach(function() {
    s1 = new MySource({ name: 's1' });
    s2 = new MySource({ name: 's2' });
    s3 = new MySource({ name: 's3' });

    coordinator = new Coordinator({ sources: [s1, s2, s3] });
  });

  hooks.afterEach(function() {
    coordinator = null;
    s1 = s2 = s3 = null;
  });

  test('can be instantiated with a name', function(assert) {
    class CustomStrategy extends Strategy {}

    strategy = new CustomStrategy({
      name: 'custom'
    });

    assert.ok(strategy);
  });

  test('requires a name', function(assert) {
    class CustomStrategy extends Strategy {}

    assert.throws(
      function() {
        strategy = new CustomStrategy();
      },
      Error('Assertion failed: Strategy requires a name'),
      'assertion raised'
    );
  });

  test('applies to all sources by default', function(assert) {
    assert.expect(1);

    class CustomStrategy extends Strategy {
      constructor(options: StrategyOptions = {}) {
        options.name = 'custom';
        super(options);
      }

      activate(coordinator: Coordinator, options: ActivationOptions = {}): Promise<any> {
        super.activate(coordinator, options);

        assert.deepEqual(this._sources, [s1, s2, s3]);

        return Orbit.Promise.resolve();
      }
    }

    strategy = new CustomStrategy();
    strategy.activate(coordinator);
  });

  test('can include only specific sources', function(assert) {
    assert.expect(1);

    class CustomStrategy extends Strategy {
      constructor(options: StrategyOptions = {}) {
        options.name = 'custom';
        super(options);
      }

      activate(coordinator: Coordinator, options: ActivationOptions = {}): Promise<any> {
        super.activate(coordinator, options);

        assert.deepEqual(this._sources, [s1, s2]);

        return Orbit.Promise.resolve();
      }
    }

    strategy = new CustomStrategy({ includeSources: ['s1', 's2'] });
    strategy.activate(coordinator);
  });

  test('can exclude specific sources', function(assert) {
    assert.expect(1);

    class CustomStrategy extends Strategy {
      constructor(options: StrategyOptions = {}) {
        options.name = 'custom';
        super(options);
      }

      activate(coordinator: Coordinator, options: ActivationOptions = {}): Promise<any> {
        super.activate(coordinator, options);

        assert.deepEqual(this._sources, [s1, s3]);

        return Orbit.Promise.resolve();
      }
    }

    strategy = new CustomStrategy({ excludeSources: ['s2'] });
    strategy.activate(coordinator);
  });
});
