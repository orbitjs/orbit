import { merge } from 'orbit/lib/objects';
import OrbitTransformBuilder from 'orbit/transform/builder';
import Operators from './operators';

export default class TransformBuilder extends OrbitTransformBuilder {
  constructor() {
    super();
    this.operators = merge(this.operators, Operators);
  }
}
