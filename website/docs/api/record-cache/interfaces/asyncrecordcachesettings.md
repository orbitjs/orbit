---
id: "AsyncRecordCacheSettings"
title: "Interface: AsyncRecordCacheSettings<QO, TO, QB, TB>"
sidebar_label: "AsyncRecordCacheSettings"
sidebar_position: 0
custom_edit_url: null
---

## Type parameters

| Name | Type |
| :------ | :------ |
| `QO` | extends `RequestOptions`[`RecordCacheQueryOptions`](RecordCacheQueryOptions.md) |
| `TO` | extends `RequestOptions`[`RecordCacheTransformOptions`](RecordCacheTransformOptions.md) |
| `QB` | `RecordQueryBuilder` |
| `TB` | `RecordTransformBuilder` |

## Hierarchy

- [`RecordCacheSettings`](RecordCacheSettings.md)<`QO`, `TO`, `QB`, `TB`\>

  ↳ **`AsyncRecordCacheSettings`**

## Properties

### debounceLiveQueries

• `Optional` **debounceLiveQueries**: `boolean`

#### Defined in

[record-cache/src/async-record-cache.ts:82](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-record-cache.ts#L82)

___

### defaultQueryOptions

• `Optional` **defaultQueryOptions**: `DefaultRequestOptions`<`QO`\>

#### Inherited from

[RecordCacheSettings](RecordCacheSettings.md).[defaultQueryOptions](RecordCacheSettings.md#defaultqueryoptions)

#### Defined in

[record-cache/src/record-cache.ts:48](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L48)

___

### defaultTransformOptions

• `Optional` **defaultTransformOptions**: `DefaultRequestOptions`<`TO`\>

#### Inherited from

[RecordCacheSettings](RecordCacheSettings.md).[defaultTransformOptions](RecordCacheSettings.md#defaulttransformoptions)

#### Defined in

[record-cache/src/record-cache.ts:49](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L49)

___

### inverseTransformOperators

• `Optional` **inverseTransformOperators**: `Dict`<[`AsyncInverseTransformOperator`](AsyncInverseTransformOperator.md)\>

#### Defined in

[record-cache/src/async-record-cache.ts:81](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-record-cache.ts#L81)

___

### keyMap

• `Optional` **keyMap**: `RecordKeyMap`

#### Inherited from

[RecordCacheSettings](RecordCacheSettings.md).[keyMap](RecordCacheSettings.md#keymap)

#### Defined in

[record-cache/src/record-cache.ts:42](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L42)

___

### name

• `Optional` **name**: `string`

#### Inherited from

[RecordCacheSettings](RecordCacheSettings.md).[name](RecordCacheSettings.md#name)

#### Defined in

[record-cache/src/record-cache.ts:40](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L40)

___

### normalizer

• `Optional` **normalizer**: `RecordNormalizer`<`string`, `RecordIdentity`, `UninitializedRecord`\>

#### Inherited from

[RecordCacheSettings](RecordCacheSettings.md).[normalizer](RecordCacheSettings.md#normalizer)

#### Defined in

[record-cache/src/record-cache.ts:43](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L43)

___

### processors

• `Optional` **processors**: [`AsyncOperationProcessorClass`](AsyncOperationProcessorClass.md)[]

#### Defined in

[record-cache/src/async-record-cache.ts:78](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-record-cache.ts#L78)

___

### queryBuilder

• `Optional` **queryBuilder**: `QB`

#### Inherited from

[RecordCacheSettings](RecordCacheSettings.md).[queryBuilder](RecordCacheSettings.md#querybuilder)

#### Defined in

[record-cache/src/record-cache.ts:46](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L46)

___

### queryOperators

• `Optional` **queryOperators**: `Dict`<[`AsyncQueryOperator`](AsyncQueryOperator.md)\>

#### Defined in

[record-cache/src/async-record-cache.ts:79](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-record-cache.ts#L79)

___

### schema

• **schema**: `RecordSchema`

#### Inherited from

[RecordCacheSettings](RecordCacheSettings.md).[schema](RecordCacheSettings.md#schema)

#### Defined in

[record-cache/src/record-cache.ts:41](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L41)

___

### transformBufferClass

• `Optional` **transformBufferClass**: [`RecordTransformBufferClass`](RecordTransformBufferClass.md)

#### Defined in

[record-cache/src/async-record-cache.ts:83](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-record-cache.ts#L83)

___

### transformBufferSettings

• `Optional` **transformBufferSettings**: [`SyncRecordCacheSettings`](SyncRecordCacheSettings.md)<`QO`, `TO`, `RecordQueryBuilder`<`string`, `RecordIdentity`\>, `RecordTransformBuilder`<`string`, `RecordIdentity`, `UninitializedRecord`\>\>

#### Defined in

[record-cache/src/async-record-cache.ts:84](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-record-cache.ts#L84)

___

### transformBuilder

• `Optional` **transformBuilder**: `TB`

#### Inherited from

[RecordCacheSettings](RecordCacheSettings.md).[transformBuilder](RecordCacheSettings.md#transformbuilder)

#### Defined in

[record-cache/src/record-cache.ts:47](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L47)

___

### transformOperators

• `Optional` **transformOperators**: `Dict`<[`AsyncTransformOperator`](AsyncTransformOperator.md)\>

#### Defined in

[record-cache/src/async-record-cache.ts:80](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-record-cache.ts#L80)

___

### validatorFor

• `Optional` **validatorFor**: `ValidatorForFn`<`Validator`<`unknown`[], `ArrayValidationOptions`, `ArrayValidationIssue`\> \| `Validator`<`boolean`, `undefined`, `TypeIssue`\> \| `Validator`<`Date`, `DateValidationOptions`, `DateValidationIssue`\> \| `Validator`<`number`, `NumberValidationOptions`, `NumberValidationIssue`\> \| `Validator`<`unknown`, `ValidationOptions`, `TypeIssue`\> \| `Validator`<`string`, `StringValidationOptions`, `StringValidationIssue`\> \| `Validator`<`InitializedRecord`, `RecordValidationOptions`, `RecordValidationIssue`\> \| `Validator`<`RecordAttributeInput`, `RecordAttributeValidationOptions`, `RecordAttributeValidationIssue`\> \| `Validator`<`RecordIdentity`, `RecordIdentityValidationOptions`, `RecordIdentityValidationIssue`\> \| `Validator`<`RecordKeyInput`, `RecordKeyValidationOptions`, `RecordKeyValidationIssue`\> \| `Validator`<`RecordOperation`, `RecordOperationValidationOptions`, `RecordOperationValidationIssue`\> \| `Validator`<`RecordQueryExpression`, `RecordQueryExpressionValidationOptions`, `RecordQueryExpressionValidationIssue`\> \| `Validator`<`RecordRelationshipInput`, `RecordRelationshipValidationOptions`, `RecordRelationshipValidationIssue`\> \| `Validator`<`string`, `RecordTypeValidationOptions`, `RecordTypeValidationIssue`\> \| `Validator`<`RelatedRecordInput`, `RelatedRecordValidationOptions`, `RelatedRecordValidationIssue`\> \| `Validator`<`RecordFieldDefinitionInput`, `RecordFieldDefinitionValidationOptions`, `RecordFieldDefinitionIssue`\>\>

#### Inherited from

[RecordCacheSettings](RecordCacheSettings.md).[validatorFor](RecordCacheSettings.md#validatorfor)

#### Defined in

[record-cache/src/record-cache.ts:44](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L44)

___

### validators

• `Optional` **validators**: `Dict`<`Validator`<`unknown`[], `ArrayValidationOptions`, `ArrayValidationIssue`\> \| `Validator`<`boolean`, `undefined`, `TypeIssue`\> \| `Validator`<`Date`, `DateValidationOptions`, `DateValidationIssue`\> \| `Validator`<`number`, `NumberValidationOptions`, `NumberValidationIssue`\> \| `Validator`<`unknown`, `ValidationOptions`, `TypeIssue`\> \| `Validator`<`string`, `StringValidationOptions`, `StringValidationIssue`\> \| `Validator`<`InitializedRecord`, `RecordValidationOptions`, `RecordValidationIssue`\> \| `Validator`<`RecordAttributeInput`, `RecordAttributeValidationOptions`, `RecordAttributeValidationIssue`\> \| `Validator`<`RecordIdentity`, `RecordIdentityValidationOptions`, `RecordIdentityValidationIssue`\> \| `Validator`<`RecordKeyInput`, `RecordKeyValidationOptions`, `RecordKeyValidationIssue`\> \| `Validator`<`RecordOperation`, `RecordOperationValidationOptions`, `RecordOperationValidationIssue`\> \| `Validator`<`RecordQueryExpression`, `RecordQueryExpressionValidationOptions`, `RecordQueryExpressionValidationIssue`\> \| `Validator`<`RecordRelationshipInput`, `RecordRelationshipValidationOptions`, `RecordRelationshipValidationIssue`\> \| `Validator`<`string`, `RecordTypeValidationOptions`, `RecordTypeValidationIssue`\> \| `Validator`<`RelatedRecordInput`, `RelatedRecordValidationOptions`, `RelatedRecordValidationIssue`\> \| `Validator`<`RecordFieldDefinitionInput`, `RecordFieldDefinitionValidationOptions`, `RecordFieldDefinitionIssue`\>\>

#### Inherited from

[RecordCacheSettings](RecordCacheSettings.md).[validators](RecordCacheSettings.md#validators)

#### Defined in

[record-cache/src/record-cache.ts:45](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/record-cache.ts#L45)
