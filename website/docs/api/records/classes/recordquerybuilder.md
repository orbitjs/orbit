---
id: "RecordQueryBuilder"
title: "Class: RecordQueryBuilder<RT, RI>"
sidebar_label: "RecordQueryBuilder"
sidebar_position: 0
custom_edit_url: null
---

## Type parameters

| Name | Type |
| :------ | :------ |
| `RT` | `string` |
| `RI` | [`RecordIdentity`](../interfaces/RecordIdentity.md) |

## Constructors

### constructor

• **new RecordQueryBuilder**<`RT`, `RI`\>(`settings?`)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RT` | `string` |
| `RI` | [`RecordIdentity`](../interfaces/RecordIdentity.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`RecordQueryBuilderSettings`](../interfaces/RecordQueryBuilderSettings.md)<`RT`, `RI`\> |

#### Defined in

[packages/@orbit/records/src/record-query-builder.ts:37](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-builder.ts#L37)

## Properties

### $normalizer

• `Optional` **$normalizer**: [`RecordNormalizer`](../interfaces/RecordNormalizer.md)<`RT`, `RI`, [`UninitializedRecord`](../interfaces/UninitializedRecord.md)\>

#### Defined in

[packages/@orbit/records/src/record-query-builder.ts:34](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-builder.ts#L34)

___

### $schema

• `Optional` **$schema**: [`RecordSchema`](RecordSchema.md)

#### Defined in

[packages/@orbit/records/src/record-query-builder.ts:33](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-builder.ts#L33)

___

### $validatorFor

• `Optional` **$validatorFor**: `ValidatorForFn`<`Validator`<`unknown`[], `ArrayValidationOptions`, `ArrayValidationIssue`\> \| `Validator`<`boolean`, `undefined`, `TypeIssue`\> \| `Validator`<`Date`, `DateValidationOptions`, `DateValidationIssue`\> \| `Validator`<`number`, `NumberValidationOptions`, `NumberValidationIssue`\> \| `Validator`<`unknown`, `ValidationOptions`, `TypeIssue`\> \| `Validator`<`string`, `StringValidationOptions`, `StringValidationIssue`\> \| `Validator`<[`InitializedRecord`](../interfaces/InitializedRecord.md), [`RecordValidationOptions`](../interfaces/RecordValidationOptions.md), [`RecordValidationIssue`](../modules.md#recordvalidationissue)\> \| `Validator`<[`RecordAttributeInput`](../interfaces/RecordAttributeInput.md), [`RecordAttributeValidationOptions`](../interfaces/RecordAttributeValidationOptions.md), [`RecordAttributeValidationIssue`](../modules.md#recordattributevalidationissue)\> \| `Validator`<[`RecordIdentity`](../interfaces/RecordIdentity.md), [`RecordIdentityValidationOptions`](../interfaces/RecordIdentityValidationOptions.md), [`RecordIdentityValidationIssue`](../modules.md#recordidentityvalidationissue)\> \| `Validator`<[`RecordKeyInput`](../interfaces/RecordKeyInput.md), [`RecordKeyValidationOptions`](../interfaces/RecordKeyValidationOptions.md), [`RecordKeyValidationIssue`](../modules.md#recordkeyvalidationissue)\> \| `Validator`<[`RecordOperation`](../modules.md#recordoperation), [`RecordOperationValidationOptions`](../interfaces/RecordOperationValidationOptions.md), [`RecordOperationValidationIssue`](../modules.md#recordoperationvalidationissue)\> \| `Validator`<[`RecordQueryExpression`](../modules.md#recordqueryexpression), `RecordQueryExpressionValidationOptions`, `RecordQueryExpressionValidationIssue`\> \| `Validator`<[`RecordRelationshipInput`](../interfaces/RecordRelationshipInput.md), [`RecordRelationshipValidationOptions`](../interfaces/RecordRelationshipValidationOptions.md), [`RecordRelationshipValidationIssue`](../modules.md#recordrelationshipvalidationissue)\> \| `Validator`<`string`, [`RecordTypeValidationOptions`](../interfaces/RecordTypeValidationOptions.md), [`RecordTypeValidationIssue`](../modules.md#recordtypevalidationissue)\> \| `Validator`<[`RelatedRecordInput`](../interfaces/RelatedRecordInput.md), [`RelatedRecordValidationOptions`](../interfaces/RelatedRecordValidationOptions.md), [`RelatedRecordValidationIssue`](../modules.md#relatedrecordvalidationissue)\> \| `Validator`<[`RecordFieldDefinitionInput`](../interfaces/RecordFieldDefinitionInput.md), [`RecordFieldDefinitionValidationOptions`](../interfaces/RecordFieldDefinitionValidationOptions.md), [`RecordFieldDefinitionIssue`](../interfaces/RecordFieldDefinitionIssue.md)\>\>

#### Defined in

[packages/@orbit/records/src/record-query-builder.ts:35](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-builder.ts#L35)

## Methods

### $normalizeRecordIdentity

▸ **$normalizeRecordIdentity**(`ri`): [`RecordIdentity`](../interfaces/RecordIdentity.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `ri` | `RI` |

#### Returns

[`RecordIdentity`](../interfaces/RecordIdentity.md)

#### Defined in

[packages/@orbit/records/src/record-query-builder.ts:118](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-builder.ts#L118)

___

### $normalizeRecordType

▸ **$normalizeRecordType**(`rt`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `rt` | `RT` |

#### Returns

`string`

#### Defined in

[packages/@orbit/records/src/record-query-builder.ts:110](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-builder.ts#L110)

___

### findRecord

▸ **findRecord**(`record`): [`FindRecordTerm`](FindRecordTerm.md)<`RT`, `RI`\>

Find a record by its identity.

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | `RI` |

#### Returns

[`FindRecordTerm`](FindRecordTerm.md)<`RT`, `RI`\>

#### Defined in

[packages/@orbit/records/src/record-query-builder.ts:55](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-builder.ts#L55)

___

### findRecords

▸ **findRecords**(`typeOrIdentities?`): [`FindRecordsTerm`](FindRecordsTerm.md)<`RT`, `RI`\>

Find all records of a specific type.

If `type` is unspecified, find all records unfiltered by type.

#### Parameters

| Name | Type |
| :------ | :------ |
| `typeOrIdentities?` | `RT` \| `RI`[] |

#### Returns

[`FindRecordsTerm`](FindRecordsTerm.md)<`RT`, `RI`\>

#### Defined in

[packages/@orbit/records/src/record-query-builder.ts:64](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-builder.ts#L64)

___

### findRelatedRecord

▸ **findRelatedRecord**(`record`, `relationship`): [`FindRelatedRecordTerm`](FindRelatedRecordTerm.md)<`RT`, `RI`\>

Find a record in a to-one relationship.

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | `RI` |
| `relationship` | `string` |

#### Returns

[`FindRelatedRecordTerm`](FindRelatedRecordTerm.md)<`RT`, `RI`\>

#### Defined in

[packages/@orbit/records/src/record-query-builder.ts:83](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-builder.ts#L83)

___

### findRelatedRecords

▸ **findRelatedRecords**(`record`, `relationship`): [`FindRecordsTerm`](FindRecordsTerm.md)<`RT`, `RI`\>

Find records in a to-many relationship.

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | `RI` |
| `relationship` | `string` |

#### Returns

[`FindRecordsTerm`](FindRecordsTerm.md)<`RT`, `RI`\>

#### Defined in

[packages/@orbit/records/src/record-query-builder.ts:97](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-builder.ts#L97)
