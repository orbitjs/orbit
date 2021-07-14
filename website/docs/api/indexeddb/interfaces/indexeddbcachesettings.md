---
id: "IndexedDBCacheSettings"
title: "Interface: IndexedDBCacheSettings<QO, TO, QB, TB>"
sidebar_label: "IndexedDBCacheSettings"
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

- `AsyncRecordCacheSettings`<`QO`, `TO`, `QB`, `TB`\>

  ↳ **`IndexedDBCacheSettings`**

## Properties

### debounceLiveQueries

• `Optional` **debounceLiveQueries**: `boolean`

#### Inherited from

AsyncRecordCacheSettings.debounceLiveQueries

#### Defined in

record-cache/dist/modules/async-record-cache.d.ts:19

___

### defaultQueryOptions

• `Optional` **defaultQueryOptions**: `DefaultRequestOptions`<`QO`\>

#### Inherited from

AsyncRecordCacheSettings.defaultQueryOptions

#### Defined in

record-cache/dist/modules/record-cache.d.ts:22

___

### defaultTransformOptions

• `Optional` **defaultTransformOptions**: `DefaultRequestOptions`<`TO`\>

#### Inherited from

AsyncRecordCacheSettings.defaultTransformOptions

#### Defined in

record-cache/dist/modules/record-cache.d.ts:23

___

### inverseTransformOperators

• `Optional` **inverseTransformOperators**: `Dict`<`AsyncInverseTransformOperator`\>

#### Inherited from

AsyncRecordCacheSettings.inverseTransformOperators

#### Defined in

record-cache/dist/modules/async-record-cache.d.ts:18

___

### keyMap

• `Optional` **keyMap**: `RecordKeyMap`

#### Inherited from

AsyncRecordCacheSettings.keyMap

#### Defined in

record-cache/dist/modules/record-cache.d.ts:16

___

### name

• `Optional` **name**: `string`

#### Inherited from

AsyncRecordCacheSettings.name

#### Defined in

record-cache/dist/modules/record-cache.d.ts:14

___

### namespace

• `Optional` **namespace**: `string`

#### Defined in

[indexeddb/src/indexeddb-cache.ts:41](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb/src/indexeddb-cache.ts#L41)

___

### normalizer

• `Optional` **normalizer**: `RecordNormalizer`<`string`, `RecordIdentity`, `UninitializedRecord`\>

#### Inherited from

AsyncRecordCacheSettings.normalizer

#### Defined in

record-cache/dist/modules/record-cache.d.ts:17

___

### processors

• `Optional` **processors**: `AsyncOperationProcessorClass`[]

#### Inherited from

AsyncRecordCacheSettings.processors

#### Defined in

record-cache/dist/modules/async-record-cache.d.ts:15

___

### queryBuilder

• `Optional` **queryBuilder**: `QB`

#### Inherited from

AsyncRecordCacheSettings.queryBuilder

#### Defined in

record-cache/dist/modules/record-cache.d.ts:20

___

### queryOperators

• `Optional` **queryOperators**: `Dict`<`AsyncQueryOperator`\>

#### Inherited from

AsyncRecordCacheSettings.queryOperators

#### Defined in

record-cache/dist/modules/async-record-cache.d.ts:16

___

### schema

• **schema**: `RecordSchema`

#### Inherited from

AsyncRecordCacheSettings.schema

#### Defined in

record-cache/dist/modules/record-cache.d.ts:15

___

### transformBufferClass

• `Optional` **transformBufferClass**: `RecordTransformBufferClass`

#### Inherited from

AsyncRecordCacheSettings.transformBufferClass

#### Defined in

record-cache/dist/modules/async-record-cache.d.ts:20

___

### transformBufferSettings

• `Optional` **transformBufferSettings**: `SyncRecordCacheSettings`<`QO`, `TO`, `RecordQueryBuilder`<`string`, `RecordIdentity`\>, `RecordTransformBuilder`<`string`, `RecordIdentity`, `UninitializedRecord`\>\>

#### Inherited from

AsyncRecordCacheSettings.transformBufferSettings

#### Defined in

record-cache/dist/modules/async-record-cache.d.ts:21

___

### transformBuilder

• `Optional` **transformBuilder**: `TB`

#### Inherited from

AsyncRecordCacheSettings.transformBuilder

#### Defined in

record-cache/dist/modules/record-cache.d.ts:21

___

### transformOperators

• `Optional` **transformOperators**: `Dict`<`AsyncTransformOperator`\>

#### Inherited from

AsyncRecordCacheSettings.transformOperators

#### Defined in

record-cache/dist/modules/async-record-cache.d.ts:17

___

### validatorFor

• `Optional` **validatorFor**: `ValidatorForFn`<`Validator`<`unknown`[], `ArrayValidationOptions`, `ArrayValidationIssue`\> \| `Validator`<`boolean`, `undefined`, `TypeIssue`\> \| `Validator`<`Date`, `DateValidationOptions`, `DateValidationIssue`\> \| `Validator`<`number`, `NumberValidationOptions`, `NumberValidationIssue`\> \| `Validator`<`unknown`, `ValidationOptions`, `TypeIssue`\> \| `Validator`<`string`, `StringValidationOptions`, `StringValidationIssue`\> \| `Validator`<`InitializedRecord`, `RecordValidationOptions`, `RecordValidationIssue`\> \| `Validator`<`RecordAttributeInput`, `RecordAttributeValidationOptions`, `RecordAttributeValidationIssue`\> \| `Validator`<`RecordIdentity`, `RecordIdentityValidationOptions`, `RecordIdentityValidationIssue`\> \| `Validator`<`RecordKeyInput`, `RecordKeyValidationOptions`, `RecordKeyValidationIssue`\> \| `Validator`<`RecordOperation`, `RecordOperationValidationOptions`, `RecordOperationValidationIssue`\> \| `Validator`<`RecordQueryExpression`, `RecordQueryExpressionValidationOptions`, `RecordQueryExpressionValidationIssue`\> \| `Validator`<`RecordRelationshipInput`, `RecordRelationshipValidationOptions`, `RecordRelationshipValidationIssue`\> \| `Validator`<`string`, `RecordTypeValidationOptions`, `RecordTypeValidationIssue`\> \| `Validator`<`RelatedRecordInput`, `RelatedRecordValidationOptions`, `RelatedRecordValidationIssue`\> \| `Validator`<`RecordFieldDefinitionInput`, `RecordFieldDefinitionValidationOptions`, `RecordFieldDefinitionIssue`\>\>

#### Inherited from

AsyncRecordCacheSettings.validatorFor

#### Defined in

record-cache/dist/modules/record-cache.d.ts:18

___

### validators

• `Optional` **validators**: `Dict`<`Validator`<`unknown`[], `ArrayValidationOptions`, `ArrayValidationIssue`\> \| `Validator`<`boolean`, `undefined`, `TypeIssue`\> \| `Validator`<`Date`, `DateValidationOptions`, `DateValidationIssue`\> \| `Validator`<`number`, `NumberValidationOptions`, `NumberValidationIssue`\> \| `Validator`<`unknown`, `ValidationOptions`, `TypeIssue`\> \| `Validator`<`string`, `StringValidationOptions`, `StringValidationIssue`\> \| `Validator`<`InitializedRecord`, `RecordValidationOptions`, `RecordValidationIssue`\> \| `Validator`<`RecordAttributeInput`, `RecordAttributeValidationOptions`, `RecordAttributeValidationIssue`\> \| `Validator`<`RecordIdentity`, `RecordIdentityValidationOptions`, `RecordIdentityValidationIssue`\> \| `Validator`<`RecordKeyInput`, `RecordKeyValidationOptions`, `RecordKeyValidationIssue`\> \| `Validator`<`RecordOperation`, `RecordOperationValidationOptions`, `RecordOperationValidationIssue`\> \| `Validator`<`RecordQueryExpression`, `RecordQueryExpressionValidationOptions`, `RecordQueryExpressionValidationIssue`\> \| `Validator`<`RecordRelationshipInput`, `RecordRelationshipValidationOptions`, `RecordRelationshipValidationIssue`\> \| `Validator`<`string`, `RecordTypeValidationOptions`, `RecordTypeValidationIssue`\> \| `Validator`<`RelatedRecordInput`, `RelatedRecordValidationOptions`, `RelatedRecordValidationIssue`\> \| `Validator`<`RecordFieldDefinitionInput`, `RecordFieldDefinitionValidationOptions`, `RecordFieldDefinitionIssue`\>\>

#### Inherited from

AsyncRecordCacheSettings.validators

#### Defined in

record-cache/dist/modules/record-cache.d.ts:19
