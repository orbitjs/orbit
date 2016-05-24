import Transform from '../transform';

export default class TransformBuilder {
  constructor() {
    this.operators = {};
  }

  build(fn) {
    this.operators.operations = [];

    fn(this.operators);

    return Transform.from(this.operators.operations);
  }
}
