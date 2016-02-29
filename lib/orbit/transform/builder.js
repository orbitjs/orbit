import Transform from '../transform';

export default class TransformBuilder {
  build(fn) {
    this.transform = new Transform();

    fn(this);

    return this.transform;
  }
}
