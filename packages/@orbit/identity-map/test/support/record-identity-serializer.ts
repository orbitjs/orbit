import { RecordIdentity, serializeRecordIdentity, deserializeRecordIdentity } from '@orbit/data';

import { IdentitySerializer } from '../src/index';

export default class RecordIdentitySerializer implements IdentitySerializer<RecordIdentity> {
  serialize(identity: RecordIdentity): string {
    return serializeRecordIdentity(identity);
  }

  deserialize(identifier: string): RecordIdentity {
    return deserializeRecordIdentity(identifier);
  }
}
