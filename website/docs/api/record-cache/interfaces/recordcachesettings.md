---
id: "RecordCacheSettings"
title: "Interface: RecordCacheSettings<QueryOptions, TransformOptions, QueryBuilder, TransformBuilder>"
sidebar_label: "RecordCacheSettings"
sidebar_position: 0
custom_edit_url: null
---

## Type parameters

| Name | Type |
| :------ | :------ |
| `QueryOptions` | extends `RequestOptions`[`RecordCacheQueryOptions`](RecordCacheQueryOptions.md) |
| `TransformOptions` | extends `RequestOptions`[`RecordCacheTransformOptions`](RecordCacheTransformOptions.md) |
| `QueryBuilder` | `RecordQueryBuilder` |
| `TransformBuilder` | `RecordTransformBuilder` |

## Hierarchy

- **`RecordCacheSettings`**

  ↳ [`AsyncRecordCacheSettings`](AsyncRecordCacheSettings.md)

  ↳ [`SyncRecordCacheSettings`](SyncRecordCacheSettings.md)

## Properties

### defaultQueryOptions

• `Optional` **defaultQueryOptions**: `DefaultRequestOptions`<`QueryOptions`\>

#### Defined in

[record-cache/src/record-cache.ts:48](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L48)

___

### defaultTransformOptions

• `Optional` **defaultTransformOptions**: `DefaultRequestOptions`<`TransformOptions`\>

#### Defined in

[record-cache/src/record-cache.ts:49](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L49)

___

### keyMap

• `Optional` **keyMap**: `RecordKeyMap`

#### Defined in

[record-cache/src/record-cache.ts:42](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L42)

___

### name

• `Optional` **name**: `string`

#### Defined in

[record-cache/src/record-cache.ts:40](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L40)

___

### normalizer

• `Optional` **normalizer**: `RecordNormalizer`<`string`, `RecordIdentity`, `UninitializedRecord`\>

#### Defined in

[record-cache/src/record-cache.ts:43](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L43)

___

### queryBuilder

• `Optional` **queryBuilder**: `QueryBuilder`

#### Defined in

[record-cache/src/record-cache.ts:46](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L46)

___

### schema

• **schema**: `RecordSchema`

#### Defined in

[record-cache/src/record-cache.ts:41](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L41)

___

### transformBuilder

• `Optional` **transformBuilder**: `TransformBuilder`

#### Defined in

[record-cache/src/record-cache.ts:47](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L47)

___

### validatorFor

• `Optional` **validatorFor**: `ValidatorForFn`<`Validator`<`unknown`[], `ArrayValidationOptions`, `ArrayValidationIssue`\> \| `Validator`<`boolean`, `undefined`, `TypeIssue`\> \| `Validator`<`Date`, `DateValidationOptions`, `DateValidationIssue`\> \| `Validator`<`number`, `NumberValidationOptions`, `NumberValidationIssue`\> \| `Validator`<`unknown`, `ValidationOptions`, `TypeIssue`\> \| `Validator`<`string`, `StringValidationOptions`, `StringValidationIssue`\> \| `Validator`<`InitializedRecord`, `RecordValidationOptions`, `RecordValidationIssue`\> \| `Validator`<`RecordAttributeInput`, `RecordAttributeValidationOptions`, `RecordAttributeValidationIssue`\> \| `Validator`<`RecordIdentity`, `RecordIdentityValidationOptions`, `RecordIdentityValidationIssue`\> \| `Validator`<`RecordKeyInput`, `RecordKeyValidationOptions`, `RecordKeyValidationIssue`\> \| `Validator`<`RecordOperation`, `RecordOperationValidationOptions`, `RecordOperationValidationIssue`\> \| `Validator`<`RecordQueryExpression`, `RecordQueryExpressionValidationOptions`, `RecordQueryExpressionValidationIssue`\> \| `Validator`<`RecordRelationshipInput`, `RecordRelationshipValidationOptions`, `RecordRelationshipValidationIssue`\> \| `Validator`<`string`, `RecordTypeValidationOptions`, `RecordTypeValidationIssue`\> \| `Validator`<`RelatedRecordInput`, `RelatedRecordValidationOptions`, `RelatedRecordValidationIssue`\> \| `Validator`<`RecordFieldDefinitionInput`, `RecordFieldDefinitionValidationOptions`, `RecordFieldDefinitionIssue`\>\>

#### Defined in

[record-cache/src/record-cache.ts:44](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L44)

___

### validators

• `Optional` **validators**: `Dict`<`Validator`<`unknown`[], `ArrayValidationOptions`, `ArrayValidationIssue`\> \| `Validator`<`boolean`, `undefined`, `TypeIssue`\> \| `Validator`<`Date`, `DateValidationOptions`, `DateValidationIssue`\> \| `Validator`<`number`, `NumberValidationOptions`, `NumberValidationIssue`\> \| `Validator`<`unknown`, `ValidationOptions`, `TypeIssue`\> \| `Validator`<`string`, `StringValidationOptions`, `StringValidationIssue`\> \| `Validator`<`InitializedRecord`, `RecordValidationOptions`, `RecordValidationIssue`\> \| `Validator`<`RecordAttributeInput`, `RecordAttributeValidationOptions`, `RecordAttributeValidationIssue`\> \| `Validator`<`RecordIdentity`, `RecordIdentityValidationOptions`, `RecordIdentityValidationIssue`\> \| `Validator`<`RecordKeyInput`, `RecordKeyValidationOptions`, `RecordKeyValidationIssue`\> \| `Validator`<`RecordOperation`, `RecordOperationValidationOptions`, `RecordOperationValidationIssue`\> \| `Validator`<`RecordQueryExpression`, `RecordQueryExpressionValidationOptions`, `RecordQueryExpressionValidationIssue`\> \| `Validator`<`RecordRelationshipInput`, `RecordRelationshipValidationOptions`, `RecordRelationshipValidationIssue`\> \| `Validator`<`string`, `RecordTypeValidationOptions`, `RecordTypeValidationIssue`\> \| `Validator`<`RelatedRecordInput`, `RelatedRecordValidationOptions`, `RelatedRecordValidationIssue`\> \| `Validator`<`RecordFieldDefinitionInput`, `RecordFieldDefinitionValidationOptions`, `RecordFieldDefinitionIssue`\>\>

#### Defined in

[record-cache/src/record-cache.ts:45](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L45)
