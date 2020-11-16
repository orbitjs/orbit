import {
  RecordIdentity,
  serializeRecordIdentity,
  deserializeRecordIdentity
} from '@orbit/records';
import { IdentitySerializer } from '../../src/index';

export class RecordIdentitySerializer
  implements IdentitySerializer<RecordIdentity> {
  serialize(identity: RecordIdentity): string {
    return serializeRecordIdentity(identity);
  }

  deserialize(identifier: string): RecordIdentity {
    return deserializeRecordIdentity(identifier);
  }
}
