import Coordinator from '../src/index';
import { 
  Source, 
  Transform, 
  addRecord 
} from '@orbit/data';
import './test-helper';

declare const RSVP: any;
const { all } = RSVP;
const { module, test } = QUnit;

module('Coordinator', function(hooks) {
  const tA = new Transform([addRecord({ type: 'planet', id: 'a', attributes: { name: 'a' } })], null, 'a');
  const tB = new Transform([addRecord({ type: 'planet', id: 'b', attributes: { name: 'b' } })], null, 'b');
  const tC = new Transform([addRecord({ type: 'planet', id: 'c', attributes: { name: 'c' } })], null, 'c');

  let coordinator, s1, s2, s3;

  hooks.beforeEach(function() {
    class MySource extends Source {}

    s1 = new MySource({ name: 's1' });
    s2 = new MySource({ name: 's2' });
    s3 = new MySource({ name: 's3' });
  });

  test('can be instantiated', function(assert) {
    coordinator = new Coordinator({ sources: [s1, s2, s3] });

    assert.ok(coordinator);
  });
});
