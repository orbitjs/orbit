import Schema from 'orbit-common/schema';
import Network from 'orbit-common/network';
import { uuid } from 'orbit/lib/uuid';

let network;

module('OC - Key Mapper', {
  beforeEach() {
    let schema = new Schema({
      modelDefaults: {
        id: { defaultValue: uuid },
        keys: {
          remoteId: {}
        }
      },
      models: {
        planet: {},
        moon: {}
      }
    });

    network = new Network(schema);
  }
});

QUnit.skip('test methods that network needs', function() {
  return network;
});
