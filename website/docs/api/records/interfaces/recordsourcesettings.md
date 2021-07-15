---
id: "RecordSourceSettings"
title: "Interface: RecordSourceSettings<QO, TO, QB, TB>"
sidebar_label: "RecordSourceSettings"
sidebar_position: 0
custom_edit_url: null
---

## Type parameters

| Name | Type |
| :------ | :------ |
| `QO` | extends `RequestOptions`[`RecordSourceQueryOptions`](RecordSourceQueryOptions.md) |
| `TO` | extends `RequestOptions``RequestOptions` |
| `QB` | [`RecordQueryBuilder`](../classes/RecordQueryBuilder.md) |
| `TB` | [`RecordTransformBuilder`](../classes/RecordTransformBuilder.md) |

## Hierarchy

- `SourceSettings`<`QO`, `TO`, `QB`, `TB`\>

  ↳ **`RecordSourceSettings`**

## Properties

### autoActivate

• `Optional` **autoActivate**: `boolean`

#### Inherited from

SourceSettings.autoActivate

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:12

___

### autoUpgrade

• `Optional` **autoUpgrade**: `boolean`

#### Defined in

[packages/@orbit/records/src/record-source.ts:36](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-source.ts#L36)

___

### bucket

• `Optional` **bucket**: `Bucket`<`unknown`\>

#### Inherited from

SourceSettings.bucket

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:9

___

### defaultQueryOptions

• `Optional` **defaultQueryOptions**: `DefaultRequestOptions`<`QO`\>

#### Inherited from

SourceSettings.defaultQueryOptions

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:15

___

### defaultTransformOptions

• `Optional` **defaultTransformOptions**: `DefaultRequestOptions`<`TO`\>

#### Inherited from

SourceSettings.defaultTransformOptions

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:16

___

### keyMap

• `Optional` **keyMap**: [`RecordKeyMap`](../classes/RecordKeyMap.md)

#### Defined in

[packages/@orbit/records/src/record-source.ts:32](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-source.ts#L32)

___

### name

• `Optional` **name**: `string`

#### Inherited from

SourceSettings.name

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:8

___

### normalizer

• `Optional` **normalizer**: [`RecordNormalizer`](RecordNormalizer.md)<`string`, [`RecordIdentity`](RecordIdentity.md), [`UninitializedRecord`](UninitializedRecord.md)\>

#### Defined in

[packages/@orbit/records/src/record-source.ts:33](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-source.ts#L33)

___

### queryBuilder

• `Optional` **queryBuilder**: `QB`

#### Inherited from

SourceSettings.queryBuilder

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:10

___

### requestQueueSettings

• `Optional` **requestQueueSettings**: `TaskQueueSettings`<`string`, `unknown`, `unknown`\>

#### Inherited from

SourceSettings.requestQueueSettings

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:13

___

### schema

• **schema**: [`RecordSchema`](../classes/RecordSchema.md)

#### Defined in

[packages/@orbit/records/src/record-source.ts:31](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-source.ts#L31)

___

### syncQueueSettings

• `Optional` **syncQueueSettings**: `TaskQueueSettings`<`string`, `unknown`, `unknown`\>

#### Inherited from

SourceSettings.syncQueueSettings

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:14

___

### transformBuilder

• `Optional` **transformBuilder**: `TB`

#### Inherited from

SourceSettings.transformBuilder

#### Defined in

packages/@orbit/data/dist/modules/source.d.ts:11

___

### validatorFor

• `Optional` **validatorFor**: `ValidatorForFn`<`Validator`<`unknown`[], `ArrayValidationOptions`, `ArrayValidationIssue`\> \| `Validator`<`boolean`, `undefined`, `TypeIssue`\> \| `Validator`<`Date`, `DateValidationOptions`, `DateValidationIssue`\> \| `Validator`<`number`, `NumberValidationOptions`, `NumberValidationIssue`\> \| `Validator`<`unknown`, `ValidationOptions`, `TypeIssue`\> \| `Validator`<`string`, `StringValidationOptions`, `StringValidationIssue`\> \| `Validator`<[`InitializedRecord`](InitializedRecord.md), [`RecordValidationOptions`](RecordValidationOptions.md), [`RecordValidationIssue`](../modules.md#recordvalidationissue)\> \| `Validator`<[`RecordAttributeInput`](RecordAttributeInput.md), [`RecordAttributeValidationOptions`](RecordAttributeValidationOptions.md), [`RecordAttributeValidationIssue`](../modules.md#recordattributevalidationissue)\> \| `Validator`<[`RecordIdentity`](RecordIdentity.md), [`RecordIdentityValidationOptions`](RecordIdentityValidationOptions.md), [`RecordIdentityValidationIssue`](../modules.md#recordidentityvalidationissue)\> \| `Validator`<[`RecordKeyInput`](RecordKeyInput.md), [`RecordKeyValidationOptions`](RecordKeyValidationOptions.md), [`RecordKeyValidationIssue`](../modules.md#recordkeyvalidationissue)\> \| `Validator`<[`RecordOperation`](../modules.md#recordoperation), [`RecordOperationValidationOptions`](RecordOperationValidationOptions.md), [`RecordOperationValidationIssue`](../modules.md#recordoperationvalidationissue)\> \| `Validator`<[`RecordQueryExpression`](../modules.md#recordqueryexpression), `RecordQueryExpressionValidationOptions`, `RecordQueryExpressionValidationIssue`\> \| `Validator`<[`RecordRelationshipInput`](RecordRelationshipInput.md), [`RecordRelationshipValidationOptions`](RecordRelationshipValidationOptions.md), [`RecordRelationshipValidationIssue`](../modules.md#recordrelationshipvalidationissue)\> \| `Validator`<`string`, [`RecordTypeValidationOptions`](RecordTypeValidationOptions.md), [`RecordTypeValidationIssue`](../modules.md#recordtypevalidationissue)\> \| `Validator`<[`RelatedRecordInput`](RelatedRecordInput.md), [`RelatedRecordValidationOptions`](RelatedRecordValidationOptions.md), [`RelatedRecordValidationIssue`](../modules.md#relatedrecordvalidationissue)\> \| `Validator`<[`RecordFieldDefinitionInput`](RecordFieldDefinitionInput.md), [`RecordFieldDefinitionValidationOptions`](RecordFieldDefinitionValidationOptions.md), [`RecordFieldDefinitionIssue`](RecordFieldDefinitionIssue.md)\>\>

#### Defined in

[packages/@orbit/records/src/record-source.ts:34](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-source.ts#L34)

___

### validators

• `Optional` **validators**: `Dict`<`Validator`<`unknown`[], `ArrayValidationOptions`, `ArrayValidationIssue`\> \| `Validator`<`boolean`, `undefined`, `TypeIssue`\> \| `Validator`<`Date`, `DateValidationOptions`, `DateValidationIssue`\> \| `Validator`<`number`, `NumberValidationOptions`, `NumberValidationIssue`\> \| `Validator`<`unknown`, `ValidationOptions`, `TypeIssue`\> \| `Validator`<`string`, `StringValidationOptions`, `StringValidationIssue`\> \| `Validator`<[`InitializedRecord`](InitializedRecord.md), [`RecordValidationOptions`](RecordValidationOptions.md), [`RecordValidationIssue`](../modules.md#recordvalidationissue)\> \| `Validator`<[`RecordAttributeInput`](RecordAttributeInput.md), [`RecordAttributeValidationOptions`](RecordAttributeValidationOptions.md), [`RecordAttributeValidationIssue`](../modules.md#recordattributevalidationissue)\> \| `Validator`<[`RecordIdentity`](RecordIdentity.md), [`RecordIdentityValidationOptions`](RecordIdentityValidationOptions.md), [`RecordIdentityValidationIssue`](../modules.md#recordidentityvalidationissue)\> \| `Validator`<[`RecordKeyInput`](RecordKeyInput.md), [`RecordKeyValidationOptions`](RecordKeyValidationOptions.md), [`RecordKeyValidationIssue`](../modules.md#recordkeyvalidationissue)\> \| `Validator`<[`RecordOperation`](../modules.md#recordoperation), [`RecordOperationValidationOptions`](RecordOperationValidationOptions.md), [`RecordOperationValidationIssue`](../modules.md#recordoperationvalidationissue)\> \| `Validator`<[`RecordQueryExpression`](../modules.md#recordqueryexpression), `RecordQueryExpressionValidationOptions`, `RecordQueryExpressionValidationIssue`\> \| `Validator`<[`RecordRelationshipInput`](RecordRelationshipInput.md), [`RecordRelationshipValidationOptions`](RecordRelationshipValidationOptions.md), [`RecordRelationshipValidationIssue`](../modules.md#recordrelationshipvalidationissue)\> \| `Validator`<`string`, [`RecordTypeValidationOptions`](RecordTypeValidationOptions.md), [`RecordTypeValidationIssue`](../modules.md#recordtypevalidationissue)\> \| `Validator`<[`RelatedRecordInput`](RelatedRecordInput.md), [`RelatedRecordValidationOptions`](RelatedRecordValidationOptions.md), [`RelatedRecordValidationIssue`](../modules.md#relatedrecordvalidationissue)\> \| `Validator`<[`RecordFieldDefinitionInput`](RecordFieldDefinitionInput.md), [`RecordFieldDefinitionValidationOptions`](RecordFieldDefinitionValidationOptions.md), [`RecordFieldDefinitionIssue`](RecordFieldDefinitionIssue.md)\>\>

#### Defined in

[packages/@orbit/records/src/record-source.ts:35](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-source.ts#L35)
