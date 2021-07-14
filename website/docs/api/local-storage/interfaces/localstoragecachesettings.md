---
id: "LocalStorageCacheSettings"
title: "Interface: LocalStorageCacheSettings<QO, TO, QB, TB>"
sidebar_label: "LocalStorageCacheSettings"
sidebar_position: 0
custom_edit_url: null
---

## Type parameters

| Name | Type |
| :------ | :------ |
| `QO` | extends `RequestOptions``RecordCacheQueryOptions` |
| `TO` | extends `RequestOptions``RecordCacheTransformOptions` |
| `QB` | `RecordQueryBuilder` |
| `TB` | `RecordTransformBuilder` |

## Hierarchy

- `SyncRecordCacheSettings`<`QO`, `TO`, `QB`, `TB`\>

  ↳ **`LocalStorageCacheSettings`**

## Properties

### debounceLiveQueries

• `Optional` **debounceLiveQueries**: `boolean`

#### Inherited from

SyncRecordCacheSettings.debounceLiveQueries

#### Defined in

record-cache/dist/modules/sync-record-cache.d.ts:18

___

### defaultQueryOptions

• `Optional` **defaultQueryOptions**: `DefaultRequestOptions`<`QO`\>

#### Inherited from

SyncRecordCacheSettings.defaultQueryOptions

#### Defined in

record-cache/dist/modules/record-cache.d.ts:22

___

### defaultTransformOptions

• `Optional` **defaultTransformOptions**: `DefaultRequestOptions`<`TO`\>

#### Inherited from

SyncRecordCacheSettings.defaultTransformOptions

#### Defined in

record-cache/dist/modules/record-cache.d.ts:23

___

### delimiter

• `Optional` **delimiter**: `string`

#### Defined in

[local-storage/src/local-storage-cache.ts:25](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-cache.ts#L25)

___

### inverseTransformOperators

• `Optional` **inverseTransformOperators**: `Dict`<`SyncInverseTransformOperator`\>

#### Inherited from

SyncRecordCacheSettings.inverseTransformOperators

#### Defined in

record-cache/dist/modules/sync-record-cache.d.ts:17

___

### keyMap

• `Optional` **keyMap**: `RecordKeyMap`

#### Inherited from

SyncRecordCacheSettings.keyMap

#### Defined in

record-cache/dist/modules/record-cache.d.ts:16

___

### name

• `Optional` **name**: `string`

#### Inherited from

SyncRecordCacheSettings.name

#### Defined in

record-cache/dist/modules/record-cache.d.ts:14

___

### namespace

• `Optional` **namespace**: `string`

#### Defined in

[local-storage/src/local-storage-cache.ts:26](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-cache.ts#L26)

___

### normalizer

• `Optional` **normalizer**: `RecordNormalizer`<`string`, `RecordIdentity`, `UninitializedRecord`\>

#### Inherited from

SyncRecordCacheSettings.normalizer

#### Defined in

record-cache/dist/modules/record-cache.d.ts:17

___

### processors

• `Optional` **processors**: `SyncOperationProcessorClass`[]

#### Inherited from

SyncRecordCacheSettings.processors

#### Defined in

record-cache/dist/modules/sync-record-cache.d.ts:14

___

### queryBuilder

• `Optional` **queryBuilder**: `QB`

#### Inherited from

SyncRecordCacheSettings.queryBuilder

#### Defined in

record-cache/dist/modules/record-cache.d.ts:20

___

### queryOperators

• `Optional` **queryOperators**: `Dict`<`SyncQueryOperator`\>

#### Inherited from

SyncRecordCacheSettings.queryOperators

#### Defined in

record-cache/dist/modules/sync-record-cache.d.ts:15

___

### schema

• **schema**: `RecordSchema`

#### Inherited from

SyncRecordCacheSettings.schema

#### Defined in

record-cache/dist/modules/record-cache.d.ts:15

___

### transformBufferClass

• `Optional` **transformBufferClass**: `RecordTransformBufferClass`

#### Inherited from

SyncRecordCacheSettings.transformBufferClass

#### Defined in

record-cache/dist/modules/sync-record-cache.d.ts:19

___

### transformBufferSettings

• `Optional` **transformBufferSettings**: `SyncRecordCacheSettings`<`QO`, `TO`, `RecordQueryBuilder`<`string`, `RecordIdentity`\>, `RecordTransformBuilder`<`string`, `RecordIdentity`, `UninitializedRecord`\>\>

#### Inherited from

SyncRecordCacheSettings.transformBufferSettings

#### Defined in

record-cache/dist/modules/sync-record-cache.d.ts:20

___

### transformBuilder

• `Optional` **transformBuilder**: `TB`

#### Inherited from

SyncRecordCacheSettings.transformBuilder

#### Defined in

record-cache/dist/modules/record-cache.d.ts:21

___

### transformOperators

• `Optional` **transformOperators**: `Dict`<`SyncTransformOperator`\>

#### Inherited from

SyncRecordCacheSettings.transformOperators

#### Defined in

record-cache/dist/modules/sync-record-cache.d.ts:16

___

### validatorFor

• `Optional` **validatorFor**: `ValidatorForFn`<`Validator`<`unknown`[], `ArrayValidationOptions`, `ArrayValidationIssue`\> \| `Validator`<`boolean`, `undefined`, `TypeIssue`\> \| `Validator`<`Date`, `DateValidationOptions`, `DateValidationIssue`\> \| `Validator`<`number`, `NumberValidationOptions`, `NumberValidationIssue`\> \| `Validator`<`unknown`, `ValidationOptions`, `TypeIssue`\> \| `Validator`<`string`, `StringValidationOptions`, `StringValidationIssue`\> \| `Validator`<`InitializedRecord`, `RecordValidationOptions`, `RecordValidationIssue`\> \| `Validator`<`RecordAttributeInput`, `RecordAttributeValidationOptions`, `RecordAttributeValidationIssue`\> \| `Validator`<`RecordIdentity`, `RecordIdentityValidationOptions`, `RecordIdentityValidationIssue`\> \| `Validator`<`RecordKeyInput`, `RecordKeyValidationOptions`, `RecordKeyValidationIssue`\> \| `Validator`<`RecordOperation`, `RecordOperationValidationOptions`, `RecordOperationValidationIssue`\> \| `Validator`<`RecordQueryExpression`, `RecordQueryExpressionValidationOptions`, `RecordQueryExpressionValidationIssue`\> \| `Validator`<`RecordRelationshipInput`, `RecordRelationshipValidationOptions`, `RecordRelationshipValidationIssue`\> \| `Validator`<`string`, `RecordTypeValidationOptions`, `RecordTypeValidationIssue`\> \| `Validator`<`RelatedRecordInput`, `RelatedRecordValidationOptions`, `RelatedRecordValidationIssue`\> \| `Validator`<`RecordFieldDefinitionInput`, `RecordFieldDefinitionValidationOptions`, `RecordFieldDefinitionIssue`\>\>

#### Inherited from

SyncRecordCacheSettings.validatorFor

#### Defined in

record-cache/dist/modules/record-cache.d.ts:18

___

### validators

• `Optional` **validators**: `Dict`<`Validator`<`unknown`[], `ArrayValidationOptions`, `ArrayValidationIssue`\> \| `Validator`<`boolean`, `undefined`, `TypeIssue`\> \| `Validator`<`Date`, `DateValidationOptions`, `DateValidationIssue`\> \| `Validator`<`number`, `NumberValidationOptions`, `NumberValidationIssue`\> \| `Validator`<`unknown`, `ValidationOptions`, `TypeIssue`\> \| `Validator`<`string`, `StringValidationOptions`, `StringValidationIssue`\> \| `Validator`<`InitializedRecord`, `RecordValidationOptions`, `RecordValidationIssue`\> \| `Validator`<`RecordAttributeInput`, `RecordAttributeValidationOptions`, `RecordAttributeValidationIssue`\> \| `Validator`<`RecordIdentity`, `RecordIdentityValidationOptions`, `RecordIdentityValidationIssue`\> \| `Validator`<`RecordKeyInput`, `RecordKeyValidationOptions`, `RecordKeyValidationIssue`\> \| `Validator`<`RecordOperation`, `RecordOperationValidationOptions`, `RecordOperationValidationIssue`\> \| `Validator`<`RecordQueryExpression`, `RecordQueryExpressionValidationOptions`, `RecordQueryExpressionValidationIssue`\> \| `Validator`<`RecordRelationshipInput`, `RecordRelationshipValidationOptions`, `RecordRelationshipValidationIssue`\> \| `Validator`<`string`, `RecordTypeValidationOptions`, `RecordTypeValidationIssue`\> \| `Validator`<`RelatedRecordInput`, `RelatedRecordValidationOptions`, `RelatedRecordValidationIssue`\> \| `Validator`<`RecordFieldDefinitionInput`, `RecordFieldDefinitionValidationOptions`, `RecordFieldDefinitionIssue`\>\>

#### Inherited from

SyncRecordCacheSettings.validators

#### Defined in

record-cache/dist/modules/record-cache.d.ts:19
