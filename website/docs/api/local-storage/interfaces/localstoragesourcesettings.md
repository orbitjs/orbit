---
id: "LocalStorageSourceSettings"
title: "Interface: LocalStorageSourceSettings<QO, TO, QB, TB, QRD, TRD>"
sidebar_label: "LocalStorageSourceSettings"
sidebar_position: 0
custom_edit_url: null
---

## Type parameters

| Name | Type |
| :------ | :------ |
| `QO` | extends `RequestOptions``RecordSourceQueryOptions` |
| `TO` | extends `RequestOptions``RequestOptions` |
| `QB` | `RecordQueryBuilder` |
| `TB` | `RecordTransformBuilder` |
| `QRD` | `unknown` |
| `TRD` | extends `RecordCacheUpdateDetails``RecordCacheUpdateDetails` |

## Hierarchy

- `RecordSourceSettings`<`QO`, `TO`, `QB`, `TB`\>

  ↳ **`LocalStorageSourceSettings`**

## Properties

### autoActivate

• `Optional` **autoActivate**: `boolean`

#### Inherited from

RecordSourceSettings.autoActivate

#### Defined in

data/dist/modules/source.d.ts:12

___

### autoUpgrade

• `Optional` **autoUpgrade**: `boolean`

#### Inherited from

RecordSourceSettings.autoUpgrade

#### Defined in

records/dist/modules/record-source.d.ts:19

___

### bucket

• `Optional` **bucket**: `Bucket`<`unknown`\>

#### Inherited from

RecordSourceSettings.bucket

#### Defined in

data/dist/modules/source.d.ts:9

___

### cacheClass

• `Optional` **cacheClass**: [`LocalStorageCacheClass`](LocalStorageCacheClass.md)<`QO`, `TO`, `QB`, `TB`, `QRD`, `TRD`\>

#### Defined in

[local-storage/src/local-storage-source.ts:58](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-source.ts#L58)

___

### cacheSettings

• `Optional` **cacheSettings**: `Partial`<[`LocalStorageCacheSettings`](LocalStorageCacheSettings.md)<`QO`, `TO`, `QB`, `TB`\>\>

#### Defined in

[local-storage/src/local-storage-source.ts:59](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-source.ts#L59)

___

### defaultQueryOptions

• `Optional` **defaultQueryOptions**: `DefaultRequestOptions`<`QO`\>

#### Inherited from

RecordSourceSettings.defaultQueryOptions

#### Defined in

data/dist/modules/source.d.ts:15

___

### defaultTransformOptions

• `Optional` **defaultTransformOptions**: `DefaultRequestOptions`<`TO`\>

#### Inherited from

RecordSourceSettings.defaultTransformOptions

#### Defined in

data/dist/modules/source.d.ts:16

___

### delimiter

• `Optional` **delimiter**: `string`

#### Defined in

[local-storage/src/local-storage-source.ts:56](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-source.ts#L56)

___

### keyMap

• `Optional` **keyMap**: `RecordKeyMap`

#### Inherited from

RecordSourceSettings.keyMap

#### Defined in

records/dist/modules/record-source.d.ts:15

___

### name

• `Optional` **name**: `string`

#### Inherited from

RecordSourceSettings.name

#### Defined in

data/dist/modules/source.d.ts:8

___

### namespace

• `Optional` **namespace**: `string`

#### Defined in

[local-storage/src/local-storage-source.ts:57](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/local-storage/src/local-storage-source.ts#L57)

___

### normalizer

• `Optional` **normalizer**: `RecordNormalizer`<`string`, `RecordIdentity`, `UninitializedRecord`\>

#### Inherited from

RecordSourceSettings.normalizer

#### Defined in

records/dist/modules/record-source.d.ts:16

___

### queryBuilder

• `Optional` **queryBuilder**: `QB`

#### Inherited from

RecordSourceSettings.queryBuilder

#### Defined in

data/dist/modules/source.d.ts:10

___

### requestQueueSettings

• `Optional` **requestQueueSettings**: `TaskQueueSettings`<`string`, `unknown`, `unknown`\>

#### Inherited from

RecordSourceSettings.requestQueueSettings

#### Defined in

data/dist/modules/source.d.ts:13

___

### schema

• **schema**: `RecordSchema`

#### Inherited from

RecordSourceSettings.schema

#### Defined in

records/dist/modules/record-source.d.ts:14

___

### syncQueueSettings

• `Optional` **syncQueueSettings**: `TaskQueueSettings`<`string`, `unknown`, `unknown`\>

#### Inherited from

RecordSourceSettings.syncQueueSettings

#### Defined in

data/dist/modules/source.d.ts:14

___

### transformBuilder

• `Optional` **transformBuilder**: `TB`

#### Inherited from

RecordSourceSettings.transformBuilder

#### Defined in

data/dist/modules/source.d.ts:11

___

### validatorFor

• `Optional` **validatorFor**: `ValidatorForFn`<`Validator`<`unknown`[], `ArrayValidationOptions`, `ArrayValidationIssue`\> \| `Validator`<`boolean`, `undefined`, `TypeIssue`\> \| `Validator`<`Date`, `DateValidationOptions`, `DateValidationIssue`\> \| `Validator`<`number`, `NumberValidationOptions`, `NumberValidationIssue`\> \| `Validator`<`unknown`, `ValidationOptions`, `TypeIssue`\> \| `Validator`<`string`, `StringValidationOptions`, `StringValidationIssue`\> \| `Validator`<`InitializedRecord`, `RecordValidationOptions`, `RecordValidationIssue`\> \| `Validator`<`RecordAttributeInput`, `RecordAttributeValidationOptions`, `RecordAttributeValidationIssue`\> \| `Validator`<`RecordIdentity`, `RecordIdentityValidationOptions`, `RecordIdentityValidationIssue`\> \| `Validator`<`RecordKeyInput`, `RecordKeyValidationOptions`, `RecordKeyValidationIssue`\> \| `Validator`<`RecordOperation`, `RecordOperationValidationOptions`, `RecordOperationValidationIssue`\> \| `Validator`<`RecordQueryExpression`, `RecordQueryExpressionValidationOptions`, `RecordQueryExpressionValidationIssue`\> \| `Validator`<`RecordRelationshipInput`, `RecordRelationshipValidationOptions`, `RecordRelationshipValidationIssue`\> \| `Validator`<`string`, `RecordTypeValidationOptions`, `RecordTypeValidationIssue`\> \| `Validator`<`RelatedRecordInput`, `RelatedRecordValidationOptions`, `RelatedRecordValidationIssue`\> \| `Validator`<`RecordFieldDefinitionInput`, `RecordFieldDefinitionValidationOptions`, `RecordFieldDefinitionIssue`\>\>

#### Inherited from

RecordSourceSettings.validatorFor

#### Defined in

records/dist/modules/record-source.d.ts:17

___

### validators

• `Optional` **validators**: `Dict`<`Validator`<`unknown`[], `ArrayValidationOptions`, `ArrayValidationIssue`\> \| `Validator`<`boolean`, `undefined`, `TypeIssue`\> \| `Validator`<`Date`, `DateValidationOptions`, `DateValidationIssue`\> \| `Validator`<`number`, `NumberValidationOptions`, `NumberValidationIssue`\> \| `Validator`<`unknown`, `ValidationOptions`, `TypeIssue`\> \| `Validator`<`string`, `StringValidationOptions`, `StringValidationIssue`\> \| `Validator`<`InitializedRecord`, `RecordValidationOptions`, `RecordValidationIssue`\> \| `Validator`<`RecordAttributeInput`, `RecordAttributeValidationOptions`, `RecordAttributeValidationIssue`\> \| `Validator`<`RecordIdentity`, `RecordIdentityValidationOptions`, `RecordIdentityValidationIssue`\> \| `Validator`<`RecordKeyInput`, `RecordKeyValidationOptions`, `RecordKeyValidationIssue`\> \| `Validator`<`RecordOperation`, `RecordOperationValidationOptions`, `RecordOperationValidationIssue`\> \| `Validator`<`RecordQueryExpression`, `RecordQueryExpressionValidationOptions`, `RecordQueryExpressionValidationIssue`\> \| `Validator`<`RecordRelationshipInput`, `RecordRelationshipValidationOptions`, `RecordRelationshipValidationIssue`\> \| `Validator`<`string`, `RecordTypeValidationOptions`, `RecordTypeValidationIssue`\> \| `Validator`<`RelatedRecordInput`, `RelatedRecordValidationOptions`, `RelatedRecordValidationIssue`\> \| `Validator`<`RecordFieldDefinitionInput`, `RecordFieldDefinitionValidationOptions`, `RecordFieldDefinitionIssue`\>\>

#### Inherited from

RecordSourceSettings.validators

#### Defined in

records/dist/modules/record-source.d.ts:18
