import { uuid } from '@orbit/utils';

declare const self: any;

const Orbit: any = {
  Promise: self.Promise,
  uuid
};

export default Orbit;
