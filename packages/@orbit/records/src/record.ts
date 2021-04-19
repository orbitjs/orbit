import { Dict, isNone, clone } from '@orbit/utils';

export interface LinkObject {
  href: string;
  meta?: Dict<unknown>;
}

export type Link = string | LinkObject;

export interface RecordIdentity {
  type: string;
  id: string;
}

export interface RecordHasOneRelationship {
  data?: RecordIdentity | null;
  links?: Dict<Link>;
  meta?: Dict<unknown>;
}

export interface RecordHasManyRelationship {
  data?: RecordIdentity[];
  links?: Dict<Link>;
  meta?: Dict<unknown>;
}

export type RecordRelationship =
  | RecordHasOneRelationship
  | RecordHasManyRelationship;

export interface RecordFields {
  keys?: Dict<string>;
  attributes?: Dict<unknown>;
  relationships?: Dict<RecordRelationship>;
  links?: Dict<Link>;
  meta?: Dict<unknown>;
}

/**
 * @deprecated since v0.17, use alias `InitializedRecord` instead
 */
export interface Record extends RecordFields, RecordIdentity {}

export interface InitializedRecord extends RecordFields, RecordIdentity {}

export interface UninitializedRecord extends RecordFields {
  type: string;
  id?: string;
}

export interface RecordKeyValue {
  type: string;
  key: string;
  value: string;
}

/**
 * @deprecated since v0.17, replaced by `RecordNormalizer`
 */
export interface RecordInitializer {
  initializeRecord(record: UninitializedRecord): InitializedRecord;
}

export function cloneRecordIdentity(identity: RecordIdentity): RecordIdentity {
  const { type, id } = identity;
  return { type, id };
}

export function equalRecordIdentities(
  record1?: RecordIdentity | null,
  record2?: RecordIdentity | null
): boolean {
  return (
    (isNone(record1) && isNone(record2)) ||
    (!!record1 &&
      !!record2 &&
      record1.type === record2.type &&
      record1.id === record2.id)
  );
}

export function equalRecordIdentitySets(
  set1: RecordIdentity[],
  set2: RecordIdentity[]
): boolean {
  if (set1.length === set2.length) {
    if (set1.length === 0) {
      return true;
    }

    const serialized1 = serializeRecordIdentities(set1);
    const serialized2 = serializeRecordIdentities(set2);

    return (
      exclusiveIdentities(serialized1, serialized2).length === 0 &&
      exclusiveIdentities(serialized2, serialized1).length === 0
    );
  }
  return false;
}

export function uniqueRecordIdentities(
  set1: RecordIdentity[],
  set2: RecordIdentity[]
): RecordIdentity[] {
  return exclusiveIdentities(
    serializeRecordIdentities(set1),
    serializeRecordIdentities(set2)
  ).map((id) => deserializeRecordIdentity(id));
}

export function dedupeRecordIdentities(
  recordIdentities: RecordIdentity[]
): RecordIdentity[] {
  let dict: Dict<true> = {};
  let deduped: RecordIdentity[] = [];
  recordIdentities.forEach((ri) => {
    const sri = serializeRecordIdentity(ri);
    if (dict[sri] === undefined) {
      deduped.push(ri);
      dict[sri] = true;
    }
  });
  return deduped;
}

export function recordsInclude(
  records: RecordIdentity[],
  match: RecordIdentity
): boolean {
  for (let r of records) {
    if (equalRecordIdentities(r, match)) {
      return true;
    }
  }
  return false;
}

export function recordsIncludeAll(
  records: RecordIdentity[],
  match: RecordIdentity[]
): boolean {
  return (
    exclusiveIdentities(
      serializeRecordIdentities(match),
      serializeRecordIdentities(records)
    ).length === 0
  );
}

export function mergeRecords(
  current: InitializedRecord | null,
  updates: InitializedRecord
): InitializedRecord {
  if (current) {
    let record: InitializedRecord = cloneRecordIdentity(current);

    // Merge `meta` and `links`, replacing whole sections rather than merging
    // individual members
    mergeRecordSection(record, current, updates, 'meta', 0);
    mergeRecordSection(record, current, updates, 'links', 0);

    // Merge attributes and keys, replacing at the individual field level
    mergeRecordSection(record, current, updates, 'attributes', 1);
    mergeRecordSection(record, current, updates, 'keys', 1);

    // Merge relationships, replacing at the `data`, `links`, and `meta` level
    // for each relationship
    mergeRecordSection(record, current, updates, 'relationships', 2);

    return record;
  } else {
    return clone(updates);
  }
}

function mergeRecordSection(
  record: any,
  current: any,
  update: any,
  section: string,
  replacementDepth: number
): void {
  if (current[section] && update[section]) {
    if (replacementDepth === 0) {
      record[section] = clone(update[section]);
    } else if (replacementDepth === 1) {
      record[section] = Object.assign({}, current[section], update[section]);
    } else {
      record[section] = {};
      for (let name of Object.keys(current[section])) {
        mergeRecordSection(
          record[section],
          current[section],
          update[section],
          name,
          replacementDepth - 1
        );
      }
      for (let name of Object.keys(update[section])) {
        if (!record[section][name]) {
          record[section][name] = clone(update[section][name]);
        }
      }
    }
  } else if (current[section]) {
    record[section] = clone(current[section]);
  } else if (update[section]) {
    record[section] = clone(update[section]);
  }
}

export function isRecordIdentity(
  identity: RecordIdentity | unknown
): identity is RecordIdentity {
  const { id, type } = identity as RecordIdentity;
  return typeof id === 'string' && typeof type === 'string';
}

export function serializeRecordIdentity(record: RecordIdentity): string {
  return `${record.type}:${record.id}`;
}

export function deserializeRecordIdentity(identity: string): RecordIdentity {
  const [type, id] = identity.split(':');
  return { type, id };
}

function serializeRecordIdentities(
  recordIdentities: RecordIdentity[]
): string[] {
  return recordIdentities.map((r) => serializeRecordIdentity(r));
}

function exclusiveIdentities(
  identities1: string[],
  identities2: string[]
): string[] {
  return identities1.filter((i) => !identities2.includes(i));
}
