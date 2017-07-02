import { Dict } from '@orbit/utils';
import { RecordIdentity } from '@orbit/data';

function serializeRecordIdentity(record: RecordIdentity): string {
  return `${record.type}:${record.id}`;
}

function deserializeRecordIdentity(identity: string): RecordIdentity {
  const [type, id] = identity.split(':');
  return { type, id };
}

export default class RecordIdentityMap {
  identities: Dict<boolean>;

  constructor(base?: RecordIdentityMap) {
    const identities = this.identities = {};

    if (base) {
      Object.keys(base.identities).forEach(k => {
        identities[k] = true;
      });
    }
  }

  add(record: RecordIdentity): void {
    this.identities[serializeRecordIdentity(record)] = true;
  }

  remove(record: RecordIdentity): void {
    delete this.identities[serializeRecordIdentity(record)];
  }

  all(): RecordIdentity[] {
    return Object.keys(this.identities).map(id => deserializeRecordIdentity(id));
  }

  has(record: RecordIdentity): boolean {
    if (record) {
      return !!this.identities[serializeRecordIdentity(record)];
    } else {
      return false;
    }
  }

  exclusiveOf(other: RecordIdentityMap): RecordIdentity[] {
    return Object.keys(this.identities)
      .filter(id => !other.identities[id])
      .map(id => deserializeRecordIdentity(id));
  }
}
