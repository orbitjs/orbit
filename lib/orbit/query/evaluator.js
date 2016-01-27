import { Class } from '../lib/objects';
import QueryContext from './context';

export default Class.extend({
  target: null,

  operators: null,

  init(target, operators) {
    this.target = target;
    this.operators = operators;
  },

  evaluate(expression) {
    let context = new QueryContext(this);
    return context.evaluate(expression);
  }
});
