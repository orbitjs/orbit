import { Assertion } from '@orbit/core';
import {
  StandardValidator,
  Validator,
  ValidatorForFn
} from '@orbit/validators';
import { InitializedRecord } from '../record';
import { ModelDefinition, RecordSchema } from '../record-schema';
import {
  RecordAttributeValidationIssue,
  RecordAttributeValidator
} from './record-attribute-validator';
import {
  RecordIdentityValidationIssue,
  RecordIdentityValidator
} from './record-identity-validator';
import {
  RecordKeyValidationIssue,
  RecordKeyValidator
} from './record-key-validator';
import {
  RecordRelationshipValidationIssue,
  RecordRelationshipValidator
} from './record-relationship-validator';
import {
  StandardRecordValidators,
  StandardRecordValidator
} from './standard-record-validators';

export type RecordValidationIssue =
  | RecordIdentityValidationIssue
  | RecordKeyValidationIssue
  | RecordAttributeValidationIssue
  | RecordRelationshipValidationIssue;

export interface RecordValidationOptions {
  validatorFor: ValidatorForFn<StandardValidator | StandardRecordValidator>;
  schema: RecordSchema;
  modelDef?: ModelDefinition;
  partialRecord?: boolean;
}

export type RecordValidator = Validator<
  InitializedRecord,
  RecordValidationOptions,
  RecordValidationIssue
>;

export const validateRecord: RecordValidator = (
  record: InitializedRecord,
  options?: RecordValidationOptions
): undefined | RecordValidationIssue[] => {
  if (options?.validatorFor === undefined || options?.schema === undefined) {
    throw new Assertion(
      'validateRecord requires both a `validatorFor` and `schema`'
    );
  }

  const { validatorFor, schema, partialRecord } = options;
  let { modelDef } = options;

  // Validate record identity
  const validateRecordIdentity = validatorFor(
    StandardRecordValidators.RecordIdentity
  ) as RecordIdentityValidator;
  const recordIdentityIssues = validateRecordIdentity(record, {
    validatorFor,
    modelDef,
    schema
  });

  // Return early if there are any identity issue
  if (recordIdentityIssues) return recordIdentityIssues;

  const { type, id } = record;
  const issues = [];
  modelDef ??= schema.getModel(type);

  // Validate keys
  if (record.keys || modelDef.keys) {
    const validateKey = validatorFor(
      StandardRecordValidators.RecordKey
    ) as RecordKeyValidator;

    if (record.keys) {
      for (let k in record.keys) {
        const keyDef = modelDef.keys?.[k];
        const keyIssues = validateKey(
          { record: { type, id }, key: k, value: record.keys[k] },
          { schema, keyDef, validatorFor }
        );
        if (keyIssues) issues.push(...keyIssues);
      }
    }

    // For records that are supposed to be "full" (i.e. non-partial), verify
    // all defined keys to check if any are missing
    if (!partialRecord && modelDef.keys) {
      for (let k in modelDef.keys) {
        if (record.keys?.[k] === undefined) {
          const keyDef = modelDef.keys[k];
          const keyIssues = validateKey(
            { record: { type, id }, key: k, value: undefined as any },
            { schema, keyDef, validatorFor }
          );
          if (keyIssues) issues.push(...keyIssues);
        }
      }
    }
  }

  // Validate attributes
  if (record.attributes || modelDef.attributes) {
    const validateAttribute = validatorFor(
      StandardRecordValidators.RecordAttribute
    ) as RecordAttributeValidator;

    if (record.attributes) {
      for (let a in record.attributes) {
        const attributeDef = modelDef.attributes?.[a];
        const attrIssues = validateAttribute(
          { record: { type, id }, attribute: a, value: record.attributes[a] },
          { schema, attributeDef, validatorFor }
        );
        if (attrIssues) issues.push(...attrIssues);
      }
    }

    // For records that are supposed to be "full" (i.e. non-partial), verify
    // all defined attributes to check if any are missing
    if (!partialRecord && modelDef.attributes) {
      for (let a in modelDef.attributes) {
        if (record.attributes?.[a] === undefined) {
          const attributeDef = modelDef.attributes[a];
          const attrIssues = validateAttribute(
            { record: { type, id }, attribute: a, value: undefined },
            { schema, attributeDef, validatorFor }
          );
          if (attrIssues) issues.push(...attrIssues);
        }
      }
    }
  }

  // Validate relationships
  if (record.relationships || modelDef.relationships) {
    const validateRelationship = validatorFor(
      StandardRecordValidators.RecordRelationship
    ) as RecordRelationshipValidator;

    if (record.relationships) {
      for (let r in record.relationships) {
        const relationshipDef = modelDef.relationships?.[r];
        const relationshipIssues = validateRelationship(
          {
            record: { type, id },
            relationship: r,
            data: record.relationships[r].data as any
          },
          { schema, relationshipDef, validatorFor }
        );
        if (relationshipIssues) issues.push(...relationshipIssues);
      }
    }

    // For records that are supposed to be "full" (i.e. non-partial), verify
    // all defined relationships to check if any are missing
    if (!partialRecord && modelDef.relationships) {
      for (let r in modelDef.relationships) {
        if (record.relationships?.[r] === undefined) {
          const relationshipDef = modelDef.relationships[r];
          const relationshipIssues = validateRelationship(
            { record: { type, id }, relationship: r, data: undefined as any },
            { schema, relationshipDef, validatorFor }
          );
          if (relationshipIssues) issues.push(...relationshipIssues);
        }
      }
    }
  }

  if (issues.length > 0) return issues;
};
