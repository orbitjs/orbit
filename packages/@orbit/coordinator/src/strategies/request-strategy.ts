import { ConnectionStrategy, ConnectionStrategyOptions } from './connection-strategy';

export interface RequestStrategyOptions extends ConnectionStrategyOptions {}

export class RequestStrategy extends ConnectionStrategy {
  constructor(options: RequestStrategyOptions) {
    super(options);
  }
}
