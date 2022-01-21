import { Assertion, Orbit } from '@orbit/core';
import { clone } from '@orbit/utils';
import {
  cloneRecordIdentity,
  InitializedRecord,
  isRecordIdentity,
  RecordIdentity,
  RecordKeyValue,
  UninitializedRecord
} from './record';
import { KeyNotDefined, ModelNotDefined } from './record-exceptions';
import { RecordKeyMap } from './record-key-map';
import { RecordNormalizer } from './record-normalizer';
import { RecordSchema } from './record-schema';

const { assert, deprecate } = Orbit;

export interface StandardRecordNormalizerSettings {
  schema: RecordSchema;
  keyMap?: RecordKeyMap;
  cloneInputs?: boolean;
  validateInputs?: boolean;
}

export class StandardRecordNormalizer
  implements
    RecordNormalizer<
      string,
      RecordIdentity | RecordKeyValue,
      UninitializedRecord
    > {
  schema: RecordSchema;
  keyMap?: RecordKeyMap;
  cloneInputs?: boolean;
  validateInputs?: boolean;

  constructor(settings: StandardRecordNormalizerSettings) {
    const { schema, keyMap, cloneInputs, validateInputs } = settings;

    assert(
      "StandardRecordNormalizer's `schema` must be specified in the `settings.schema` constructor argument",
      !!schema
    );

    this.schema = schema;
    this.keyMap = keyMap;
    this.cloneInputs = cloneInputs;
    this.validateInputs = validateInputs;
  }

  normalizeRecordType(type: string): string {
    if (this.validateInputs) {
      if (typeof type !== 'string') {
        throw new Assertion(
          'StandardRecordNormalizer expects record types to be strings'
        );
      }

      if (!this.schema.hasModel(type)) {
        throw new ModelNotDefined(type);
      }
    }

    return type;
  }

  normalizeRecordIdentity(
    identity: RecordIdentity | RecordKeyValue
  ): RecordIdentity {
    const { schema, keyMap, cloneInputs, validateInputs } = this;
    const { type } = identity;

    if (validateInputs && !schema.hasModel(type)) {
      throw new ModelNotDefined(type);
    }

    if (isRecordIdentity(identity)) {
      return cloneInputs ? this.cloneRecordIdentity(identity) : identity;
    } else {
      if (keyMap === undefined) {
        throw new Assertion(
          "StandardRecordNormalizer's `keyMap` must be specified in order to lookup an `id` from a `key`"
        );
      }

      const { key, value } = identity;

      if (typeof key !== 'string' || typeof value !== 'string') {
        throw new Assertion(
          'StandardRecordNormalizer expects record identities in the form `{ type: string, id: string }` or `{ type: string, key: string, value: string }`'
        );
      }

      if (validateInputs && !schema.hasKey(type, key)) {
        throw new KeyNotDefined(type, key);
      }

      let id = keyMap.keyToId(type, key, value);

      if (id === undefined) {
        id = this.schema.generateId(type);
        keyMap.pushRecord({ type, id, keys: { [key]: value } });
      }

      return { type, id };
    }
  }

  normalizeRecord(record: UninitializedRecord): InitializedRecord {
    const { keyMap, schema, cloneInputs, validateInputs } = this;
    const { type } = record;

    if (validateInputs && !schema.hasModel(type)) {
      throw new ModelNotDefined(type);
    }

    let result = cloneInputs ? this.cloneRecord(record) : record;

    // If `initializeRecord` has been defined on the schema, continue to call it
    // but issue a deprecation warning.
    // TODO: Remove in v0.18
    if ((schema as any).initializeRecord !== undefined) {
      deprecate(
        "RecordSchema's `initializeRecord` method should NOT be defined. Instead override `normalizeRecord` on the RecordNormalizer to initialize records."
      );
      result = (schema as any).initializeRecord(result);
    }

    if (result.id === undefined) {
      const { keys } = result;

      // Lookup id from keys if possible
      if (keyMap !== undefined && keys !== undefined) {
        if (validateInputs) {
          Object.keys(keys).forEach((key) => {
            if (!schema.hasKey(type, key)) {
              throw new KeyNotDefined(type, key);
            }
          });
        }

        const id = keyMap.idFromKeys(result.type, keys);
        if (id) {
          result.id = id;
        }
      }

      // Generate an id if one has still not been assigned
      if (result.id === undefined) {
        result.id = schema.generateId(result.type);

        // Register any generated ids in the keyMap, if present
        if (keyMap && result.keys !== undefined) {
          keyMap.pushRecord(result);
        }
      }
    }

    return result as InitializedRecord;
  }

  protected cloneRecordIdentity(rid: RecordIdentity): RecordIdentity {
    return cloneRecordIdentity(rid);
  }

  protected cloneRecord(record: UninitializedRecord): UninitializedRecord {
    return clone(record);
  }
}
