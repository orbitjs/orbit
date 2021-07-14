---
id: "RecordQueryBuilderSettings"
title: "Interface: RecordQueryBuilderSettings<RT, RI>"
sidebar_label: "RecordQueryBuilderSettings"
sidebar_position: 0
custom_edit_url: null
---

## Type parameters

| Name | Type |
| :------ | :------ |
| `RT` | `string` |
| `RI` | [`RecordIdentity`](RecordIdentity.md) |

## Properties

### normalizer

• `Optional` **normalizer**: [`RecordNormalizer`](RecordNormalizer.md)<`RT`, `RI`, [`UninitializedRecord`](UninitializedRecord.md)\>

#### Defined in

[packages/@orbit/records/src/record-query-builder.ts:28](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-builder.ts#L28)

___

### schema

• `Optional` **schema**: [`RecordSchema`](../classes/RecordSchema.md)

#### Defined in

[packages/@orbit/records/src/record-query-builder.ts:27](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-builder.ts#L27)

___

### validatorFor

• `Optional` **validatorFor**: `ValidatorForFn`<`Validator`<`unknown`[], `ArrayValidationOptions`, `ArrayValidationIssue`\> \| `Validator`<`boolean`, `undefined`, `TypeIssue`\> \| `Validator`<`Date`, `DateValidationOptions`, `DateValidationIssue`\> \| `Validator`<`number`, `NumberValidationOptions`, `NumberValidationIssue`\> \| `Validator`<`unknown`, `ValidationOptions`, `TypeIssue`\> \| `Validator`<`string`, `StringValidationOptions`, `StringValidationIssue`\> \| `Validator`<[`InitializedRecord`](InitializedRecord.md), [`RecordValidationOptions`](RecordValidationOptions.md), [`RecordValidationIssue`](../modules.md#recordvalidationissue)\> \| `Validator`<[`RecordAttributeInput`](RecordAttributeInput.md), [`RecordAttributeValidationOptions`](RecordAttributeValidationOptions.md), [`RecordAttributeValidationIssue`](../modules.md#recordattributevalidationissue)\> \| `Validator`<[`RecordIdentity`](RecordIdentity.md), [`RecordIdentityValidationOptions`](RecordIdentityValidationOptions.md), [`RecordIdentityValidationIssue`](../modules.md#recordidentityvalidationissue)\> \| `Validator`<[`RecordKeyInput`](RecordKeyInput.md), [`RecordKeyValidationOptions`](RecordKeyValidationOptions.md), [`RecordKeyValidationIssue`](../modules.md#recordkeyvalidationissue)\> \| `Validator`<[`RecordOperation`](../modules.md#recordoperation), [`RecordOperationValidationOptions`](RecordOperationValidationOptions.md), [`RecordOperationValidationIssue`](../modules.md#recordoperationvalidationissue)\> \| `Validator`<[`RecordQueryExpression`](../modules.md#recordqueryexpression), `RecordQueryExpressionValidationOptions`, `RecordQueryExpressionValidationIssue`\> \| `Validator`<[`RecordRelationshipInput`](RecordRelationshipInput.md), [`RecordRelationshipValidationOptions`](RecordRelationshipValidationOptions.md), [`RecordRelationshipValidationIssue`](../modules.md#recordrelationshipvalidationissue)\> \| `Validator`<`string`, [`RecordTypeValidationOptions`](RecordTypeValidationOptions.md), [`RecordTypeValidationIssue`](../modules.md#recordtypevalidationissue)\> \| `Validator`<[`RelatedRecordInput`](RelatedRecordInput.md), [`RelatedRecordValidationOptions`](RelatedRecordValidationOptions.md), [`RelatedRecordValidationIssue`](../modules.md#relatedrecordvalidationissue)\> \| `Validator`<[`RecordFieldDefinitionInput`](RecordFieldDefinitionInput.md), [`RecordFieldDefinitionValidationOptions`](RecordFieldDefinitionValidationOptions.md), [`RecordFieldDefinitionIssue`](RecordFieldDefinitionIssue.md)\>\>

#### Defined in

[packages/@orbit/records/src/record-query-builder.ts:29](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-builder.ts#L29)
