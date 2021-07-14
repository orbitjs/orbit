---
id: "RecordTransformBuilder"
title: "Class: RecordTransformBuilder<RT, RI, R>"
sidebar_label: "RecordTransformBuilder"
sidebar_position: 0
custom_edit_url: null
---

## Type parameters

| Name | Type |
| :------ | :------ |
| `RT` | `string` |
| `RI` | [`RecordIdentity`](../interfaces/RecordIdentity.md) |
| `R` | [`UninitializedRecord`](../interfaces/UninitializedRecord.md) |

## Constructors

### constructor

• **new RecordTransformBuilder**<`RT`, `RI`, `R`\>(`settings?`)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RT` | `string` |
| `RI` | [`RecordIdentity`](../interfaces/RecordIdentity.md) |
| `R` | [`UninitializedRecord`](../interfaces/UninitializedRecord.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`RecordTransformBuilderSettings`](../interfaces/RecordTransformBuilderSettings.md)<`RT`, `RI`, `R`\> |

#### Defined in

[packages/@orbit/records/src/record-transform-builder.ts:57](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-transform-builder.ts#L57)

## Properties

### $normalizer

• `Optional` **$normalizer**: [`RecordNormalizer`](../interfaces/RecordNormalizer.md)<`RT`, `RI`, `R`\>

#### Defined in

[packages/@orbit/records/src/record-transform-builder.ts:54](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-transform-builder.ts#L54)

___

### $schema

• `Optional` **$schema**: [`RecordSchema`](RecordSchema.md)

#### Defined in

[packages/@orbit/records/src/record-transform-builder.ts:53](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-transform-builder.ts#L53)

___

### $validatorFor

• `Optional` **$validatorFor**: `ValidatorForFn`<`Validator`<`unknown`[], `ArrayValidationOptions`, `ArrayValidationIssue`\> \| `Validator`<`boolean`, `undefined`, `TypeIssue`\> \| `Validator`<`Date`, `DateValidationOptions`, `DateValidationIssue`\> \| `Validator`<`number`, `NumberValidationOptions`, `NumberValidationIssue`\> \| `Validator`<`unknown`, `ValidationOptions`, `TypeIssue`\> \| `Validator`<`string`, `StringValidationOptions`, `StringValidationIssue`\> \| `Validator`<[`InitializedRecord`](../interfaces/InitializedRecord.md), [`RecordValidationOptions`](../interfaces/RecordValidationOptions.md), [`RecordValidationIssue`](../modules.md#recordvalidationissue)\> \| `Validator`<[`RecordAttributeInput`](../interfaces/RecordAttributeInput.md), [`RecordAttributeValidationOptions`](../interfaces/RecordAttributeValidationOptions.md), [`RecordAttributeValidationIssue`](../modules.md#recordattributevalidationissue)\> \| `Validator`<[`RecordIdentity`](../interfaces/RecordIdentity.md), [`RecordIdentityValidationOptions`](../interfaces/RecordIdentityValidationOptions.md), [`RecordIdentityValidationIssue`](../modules.md#recordidentityvalidationissue)\> \| `Validator`<[`RecordKeyInput`](../interfaces/RecordKeyInput.md), [`RecordKeyValidationOptions`](../interfaces/RecordKeyValidationOptions.md), [`RecordKeyValidationIssue`](../modules.md#recordkeyvalidationissue)\> \| `Validator`<[`RecordOperation`](../modules.md#recordoperation), [`RecordOperationValidationOptions`](../interfaces/RecordOperationValidationOptions.md), [`RecordOperationValidationIssue`](../modules.md#recordoperationvalidationissue)\> \| `Validator`<[`RecordQueryExpression`](../modules.md#recordqueryexpression), `RecordQueryExpressionValidationOptions`, `RecordQueryExpressionValidationIssue`\> \| `Validator`<[`RecordRelationshipInput`](../interfaces/RecordRelationshipInput.md), [`RecordRelationshipValidationOptions`](../interfaces/RecordRelationshipValidationOptions.md), [`RecordRelationshipValidationIssue`](../modules.md#recordrelationshipvalidationissue)\> \| `Validator`<`string`, [`RecordTypeValidationOptions`](../interfaces/RecordTypeValidationOptions.md), [`RecordTypeValidationIssue`](../modules.md#recordtypevalidationissue)\> \| `Validator`<[`RelatedRecordInput`](../interfaces/RelatedRecordInput.md), [`RelatedRecordValidationOptions`](../interfaces/RelatedRecordValidationOptions.md), [`RelatedRecordValidationIssue`](../modules.md#relatedrecordvalidationissue)\> \| `Validator`<[`RecordFieldDefinitionInput`](../interfaces/RecordFieldDefinitionInput.md), [`RecordFieldDefinitionValidationOptions`](../interfaces/RecordFieldDefinitionValidationOptions.md), [`RecordFieldDefinitionIssue`](../interfaces/RecordFieldDefinitionIssue.md)\>\>

#### Defined in

[packages/@orbit/records/src/record-transform-builder.ts:55](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-transform-builder.ts#L55)

## Methods

### $normalizeRecord

▸ **$normalizeRecord**(`r`): [`InitializedRecord`](../interfaces/InitializedRecord.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `r` | `R` |

#### Returns

[`InitializedRecord`](../interfaces/InitializedRecord.md)

#### Defined in

[packages/@orbit/records/src/record-transform-builder.ts:214](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-transform-builder.ts#L214)

___

### $normalizeRecordIdentity

▸ **$normalizeRecordIdentity**(`ri`): [`RecordIdentity`](../interfaces/RecordIdentity.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `ri` | `RI` |

#### Returns

[`RecordIdentity`](../interfaces/RecordIdentity.md)

#### Defined in

[packages/@orbit/records/src/record-transform-builder.ts:222](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-transform-builder.ts#L222)

___

### addRecord

▸ **addRecord**(`record`): [`AddRecordTerm`](AddRecordTerm.md)<`RT`, `RI`, `R`\>

Instantiate a new `addRecord` operation.

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | `R` |

#### Returns

[`AddRecordTerm`](AddRecordTerm.md)<`RT`, `RI`, `R`\>

#### Defined in

[packages/@orbit/records/src/record-transform-builder.ts:100](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-transform-builder.ts#L100)

___

### addToRelatedRecords

▸ **addToRelatedRecords**(`record`, `relationship`, `relatedRecord`): [`AddToRelatedRecordsTerm`](AddToRelatedRecordsTerm.md)<`RT`, `RI`, `R`\>

Instantiate a new `addToRelatedRecords` operation.

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | `RI` |
| `relationship` | `string` |
| `relatedRecord` | `RI` |

#### Returns

[`AddToRelatedRecordsTerm`](AddToRelatedRecordsTerm.md)<`RT`, `RI`, `R`\>

#### Defined in

[packages/@orbit/records/src/record-transform-builder.ts:153](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-transform-builder.ts#L153)

___

### removeFromRelatedRecords

▸ **removeFromRelatedRecords**(`record`, `relationship`, `relatedRecord`): [`RemoveFromRelatedRecordsTerm`](RemoveFromRelatedRecordsTerm.md)<`RT`, `RI`, `R`\>

Instantiate a new `removeFromRelatedRecords` operation.

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | `RI` |
| `relationship` | `string` |
| `relatedRecord` | `RI` |

#### Returns

[`RemoveFromRelatedRecordsTerm`](RemoveFromRelatedRecordsTerm.md)<`RT`, `RI`, `R`\>

#### Defined in

[packages/@orbit/records/src/record-transform-builder.ts:169](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-transform-builder.ts#L169)

___

### removeRecord

▸ **removeRecord**(`record`): [`RemoveRecordTerm`](RemoveRecordTerm.md)<`RT`, `RI`, `R`\>

Instantiate a new `removeRecord` operation.

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | `RI` |

#### Returns

[`RemoveRecordTerm`](RemoveRecordTerm.md)<`RT`, `RI`, `R`\>

#### Defined in

[packages/@orbit/records/src/record-transform-builder.ts:114](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-transform-builder.ts#L114)

___

### replaceAttribute

▸ **replaceAttribute**(`record`, `attribute`, `value`): [`ReplaceAttributeTerm`](ReplaceAttributeTerm.md)<`RT`, `RI`, `R`\>

Instantiate a new `replaceAttribute` operation.

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | `RI` |
| `attribute` | `string` |
| `value` | `unknown` |

#### Returns

[`ReplaceAttributeTerm`](ReplaceAttributeTerm.md)<`RT`, `RI`, `R`\>

#### Defined in

[packages/@orbit/records/src/record-transform-builder.ts:137](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-transform-builder.ts#L137)

___

### replaceKey

▸ **replaceKey**(`record`, `key`, `value`): [`ReplaceKeyTerm`](ReplaceKeyTerm.md)<`RT`, `RI`, `R`\>

Instantiate a new `replaceKey` operation.

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | `RI` |
| `key` | `string` |
| `value` | `string` |

#### Returns

[`ReplaceKeyTerm`](ReplaceKeyTerm.md)<`RT`, `RI`, `R`\>

#### Defined in

[packages/@orbit/records/src/record-transform-builder.ts:121](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-transform-builder.ts#L121)

___

### replaceRelatedRecord

▸ **replaceRelatedRecord**(`record`, `relationship`, `relatedRecord`): [`ReplaceRelatedRecordTerm`](ReplaceRelatedRecordTerm.md)<`RT`, `RI`, `R`\>

Instantiate a new `replaceRelatedRecord` operation.

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | `RI` |
| `relationship` | `string` |
| `relatedRecord` | ``null`` \| `RI` |

#### Returns

[`ReplaceRelatedRecordTerm`](ReplaceRelatedRecordTerm.md)<`RT`, `RI`, `R`\>

#### Defined in

[packages/@orbit/records/src/record-transform-builder.ts:201](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-transform-builder.ts#L201)

___

### replaceRelatedRecords

▸ **replaceRelatedRecords**(`record`, `relationship`, `relatedRecords`): [`ReplaceRelatedRecordsTerm`](ReplaceRelatedRecordsTerm.md)<`RT`, `RI`, `R`\>

Instantiate a new `replaceRelatedRecords` operation.

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | `RI` |
| `relationship` | `string` |
| `relatedRecords` | `RI`[] |

#### Returns

[`ReplaceRelatedRecordsTerm`](ReplaceRelatedRecordsTerm.md)<`RT`, `RI`, `R`\>

#### Defined in

[packages/@orbit/records/src/record-transform-builder.ts:185](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-transform-builder.ts#L185)

___

### updateRecord

▸ **updateRecord**(`record`): [`UpdateRecordTerm`](UpdateRecordTerm.md)<`RT`, `RI`, `R`\>

Instantiate a new `updateRecord` operation.

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | `R` |

#### Returns

[`UpdateRecordTerm`](UpdateRecordTerm.md)<`RT`, `RI`, `R`\>

#### Defined in

[packages/@orbit/records/src/record-transform-builder.ts:107](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-transform-builder.ts#L107)
