---
id: "RecordIdentityValidationOptions"
title: "Interface: RecordIdentityValidationOptions"
sidebar_label: "RecordIdentityValidationOptions"
sidebar_position: 0
custom_edit_url: null
---

## Properties

### modelDef

• `Optional` **modelDef**: [`ModelDefinition`](ModelDefinition.md)

#### Defined in

[packages/@orbit/records/src/record-validators/record-identity-validator.ts:35](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/record-identity-validator.ts#L35)

___

### schema

• `Optional` **schema**: [`RecordSchema`](../classes/RecordSchema.md)

#### Defined in

[packages/@orbit/records/src/record-validators/record-identity-validator.ts:34](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/record-identity-validator.ts#L34)

___

### validatorFor

• **validatorFor**: `ValidatorForFn`<`Validator`<`unknown`[], `ArrayValidationOptions`, `ArrayValidationIssue`\> \| `Validator`<`boolean`, `undefined`, `TypeIssue`\> \| `Validator`<`Date`, `DateValidationOptions`, `DateValidationIssue`\> \| `Validator`<`number`, `NumberValidationOptions`, `NumberValidationIssue`\> \| `Validator`<`unknown`, `ValidationOptions`, `TypeIssue`\> \| `Validator`<`string`, `StringValidationOptions`, `StringValidationIssue`\> \| `Validator`<[`InitializedRecord`](InitializedRecord.md), [`RecordValidationOptions`](RecordValidationOptions.md), [`RecordValidationIssue`](../modules.md#recordvalidationissue)\> \| `Validator`<[`RecordAttributeInput`](RecordAttributeInput.md), [`RecordAttributeValidationOptions`](RecordAttributeValidationOptions.md), [`RecordAttributeValidationIssue`](../modules.md#recordattributevalidationissue)\> \| `Validator`<[`RecordIdentity`](RecordIdentity.md), [`RecordIdentityValidationOptions`](RecordIdentityValidationOptions.md), [`RecordIdentityValidationIssue`](../modules.md#recordidentityvalidationissue)\> \| `Validator`<[`RecordKeyInput`](RecordKeyInput.md), [`RecordKeyValidationOptions`](RecordKeyValidationOptions.md), [`RecordKeyValidationIssue`](../modules.md#recordkeyvalidationissue)\> \| `Validator`<[`RecordOperation`](../modules.md#recordoperation), [`RecordOperationValidationOptions`](RecordOperationValidationOptions.md), [`RecordOperationValidationIssue`](../modules.md#recordoperationvalidationissue)\> \| `Validator`<[`RecordQueryExpression`](../modules.md#recordqueryexpression), `RecordQueryExpressionValidationOptions`, `RecordQueryExpressionValidationIssue`\> \| `Validator`<[`RecordRelationshipInput`](RecordRelationshipInput.md), [`RecordRelationshipValidationOptions`](RecordRelationshipValidationOptions.md), [`RecordRelationshipValidationIssue`](../modules.md#recordrelationshipvalidationissue)\> \| `Validator`<`string`, [`RecordTypeValidationOptions`](RecordTypeValidationOptions.md), [`RecordTypeValidationIssue`](../modules.md#recordtypevalidationissue)\> \| `Validator`<[`RelatedRecordInput`](RelatedRecordInput.md), [`RelatedRecordValidationOptions`](RelatedRecordValidationOptions.md), [`RelatedRecordValidationIssue`](../modules.md#relatedrecordvalidationissue)\> \| `Validator`<[`RecordFieldDefinitionInput`](RecordFieldDefinitionInput.md), [`RecordFieldDefinitionValidationOptions`](RecordFieldDefinitionValidationOptions.md), [`RecordFieldDefinitionIssue`](RecordFieldDefinitionIssue.md)\>\>

#### Defined in

[packages/@orbit/records/src/record-validators/record-identity-validator.ts:33](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/record-identity-validator.ts#L33)
