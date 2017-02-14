import { Identity } from './identity';

export interface Record extends Identity {
  keys?: Object; // TODO
  attributes?: Object;
  relationships?: Object; // TODO
}
