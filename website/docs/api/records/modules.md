---
id: "modules"
title: "@orbit/records"
sidebar_label: "Exports"
sidebar_position: 0.5
custom_edit_url: null
---

## Enumerations

- [StandardRecordValidators](enums/StandardRecordValidators.md)

## Classes

- [AddRecordTerm](classes/AddRecordTerm.md)
- [AddToRelatedRecordsTerm](classes/AddToRelatedRecordsTerm.md)
- [AttributeNotDefined](classes/AttributeNotDefined.md)
- [BaseRecordOperationTerm](classes/BaseRecordOperationTerm.md)
- [BaseRecordQueryTerm](classes/BaseRecordQueryTerm.md)
- [FindRecordTerm](classes/FindRecordTerm.md)
- [FindRecordsTerm](classes/FindRecordsTerm.md)
- [FindRelatedRecordTerm](classes/FindRelatedRecordTerm.md)
- [KeyNotDefined](classes/KeyNotDefined.md)
- [ModelNotDefined](classes/ModelNotDefined.md)
- [RecordException](classes/RecordException.md)
- [RecordKeyMap](classes/RecordKeyMap.md)
- [RecordNotFoundException](classes/RecordNotFoundException.md)
- [RecordQueryBuilder](classes/RecordQueryBuilder.md)
- [RecordSchema](classes/RecordSchema.md)
- [RecordSource](classes/RecordSource.md)
- [RecordTransformBuilder](classes/RecordTransformBuilder.md)
- [RelationshipNotDefined](classes/RelationshipNotDefined.md)
- [RemoveFromRelatedRecordsTerm](classes/RemoveFromRelatedRecordsTerm.md)
- [RemoveRecordTerm](classes/RemoveRecordTerm.md)
- [ReplaceAttributeTerm](classes/ReplaceAttributeTerm.md)
- [ReplaceKeyTerm](classes/ReplaceKeyTerm.md)
- [ReplaceRelatedRecordTerm](classes/ReplaceRelatedRecordTerm.md)
- [ReplaceRelatedRecordsTerm](classes/ReplaceRelatedRecordsTerm.md)
- [SchemaError](classes/SchemaError.md)
- [StandardRecordNormalizer](classes/StandardRecordNormalizer.md)
- [UpdateRecordTerm](classes/UpdateRecordTerm.md)
- [ValidationError](classes/ValidationError.md)

## Interfaces

- [AddRecordOperation](interfaces/AddRecordOperation.md)
- [AddToRelatedRecordsOperation](interfaces/AddToRelatedRecordsOperation.md)
- [AttributeDefinition](interfaces/AttributeDefinition.md)
- [AttributeFilterParam](interfaces/AttributeFilterParam.md)
- [AttributeFilterSpecifier](interfaces/AttributeFilterSpecifier.md)
- [AttributeSortParam](interfaces/AttributeSortParam.md)
- [AttributeSortSpecifier](interfaces/AttributeSortSpecifier.md)
- [BaseFilterSpecifier](interfaces/BaseFilterSpecifier.md)
- [BasePageSpecifier](interfaces/BasePageSpecifier.md)
- [BaseSortSpecifier](interfaces/BaseSortSpecifier.md)
- [FieldValidationOptions](interfaces/FieldValidationOptions.md)
- [FindRecord](interfaces/FindRecord.md)
- [FindRecords](interfaces/FindRecords.md)
- [FindRelatedRecord](interfaces/FindRelatedRecord.md)
- [FindRelatedRecords](interfaces/FindRelatedRecords.md)
- [HasManyRelationshipDefinition](interfaces/HasManyRelationshipDefinition.md)
- [HasOneRelationshipDefinition](interfaces/HasOneRelationshipDefinition.md)
- [InitializedRecord](interfaces/InitializedRecord.md)
- [KeyDefinition](interfaces/KeyDefinition.md)
- [LinkObject](interfaces/LinkObject.md)
- [ModelDefinition](interfaces/ModelDefinition.md)
- [OffsetLimitPageSpecifier](interfaces/OffsetLimitPageSpecifier.md)
- [PageParam](interfaces/PageParam.md)
- [Record](interfaces/Record.md)
- [RecordAttributeInput](interfaces/RecordAttributeInput.md)
- [RecordAttributeValidationOptions](interfaces/RecordAttributeValidationOptions.md)
- [RecordFieldDefinitionInput](interfaces/RecordFieldDefinitionInput.md)
- [RecordFieldDefinitionIssue](interfaces/RecordFieldDefinitionIssue.md)
- [RecordFieldDefinitionValidationOptions](interfaces/RecordFieldDefinitionValidationOptions.md)
- [RecordFields](interfaces/RecordFields.md)
- [RecordHasManyRelationship](interfaces/RecordHasManyRelationship.md)
- [RecordHasOneRelationship](interfaces/RecordHasOneRelationship.md)
- [RecordIdentity](interfaces/RecordIdentity.md)
- [RecordIdentityValidationOptions](interfaces/RecordIdentityValidationOptions.md)
- [RecordInitializer](interfaces/RecordInitializer.md)
- [RecordKeyInput](interfaces/RecordKeyInput.md)
- [RecordKeyValidationOptions](interfaces/RecordKeyValidationOptions.md)
- [RecordKeyValue](interfaces/RecordKeyValue.md)
- [RecordNormalizer](interfaces/RecordNormalizer.md)
- [RecordOperationValidationOptions](interfaces/RecordOperationValidationOptions.md)
- [RecordQueryBuilderSettings](interfaces/RecordQueryBuilderSettings.md)
- [RecordRelationshipInput](interfaces/RecordRelationshipInput.md)
- [RecordRelationshipValidationOptions](interfaces/RecordRelationshipValidationOptions.md)
- [RecordSchemaSettings](interfaces/RecordSchemaSettings.md)
- [RecordSourceQueryOptions](interfaces/RecordSourceQueryOptions.md)
- [RecordSourceSettings](interfaces/RecordSourceSettings.md)
- [RecordTransformBuilderSettings](interfaces/RecordTransformBuilderSettings.md)
- [RecordTypeValidationOptions](interfaces/RecordTypeValidationOptions.md)
- [RecordValidationOptions](interfaces/RecordValidationOptions.md)
- [RelatedRecordFilterParam](interfaces/RelatedRecordFilterParam.md)
- [RelatedRecordFilterSpecifier](interfaces/RelatedRecordFilterSpecifier.md)
- [RelatedRecordInput](interfaces/RelatedRecordInput.md)
- [RelatedRecordValidationOptions](interfaces/RelatedRecordValidationOptions.md)
- [RelatedRecordsFilterParam](interfaces/RelatedRecordsFilterParam.md)
- [RelatedRecordsFilterSpecifier](interfaces/RelatedRecordsFilterSpecifier.md)
- [RemoveFromRelatedRecordsOperation](interfaces/RemoveFromRelatedRecordsOperation.md)
- [RemoveRecordOperation](interfaces/RemoveRecordOperation.md)
- [ReplaceAttributeOperation](interfaces/ReplaceAttributeOperation.md)
- [ReplaceKeyOperation](interfaces/ReplaceKeyOperation.md)
- [ReplaceRelatedRecordOperation](interfaces/ReplaceRelatedRecordOperation.md)
- [ReplaceRelatedRecordsOperation](interfaces/ReplaceRelatedRecordsOperation.md)
- [StandardRecordNormalizerSettings](interfaces/StandardRecordNormalizerSettings.md)
- [UninitializedRecord](interfaces/UninitializedRecord.md)
- [UpdateRecordOperation](interfaces/UpdateRecordOperation.md)

## Type aliases

### AddRecordOperationResult

Ƭ **AddRecordOperationResult**: [`InitializedRecord`](interfaces/InitializedRecord.md)

#### Defined in

[packages/@orbit/records/src/record-operation.ts:110](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation.ts#L110)

___

### AddToRelatedRecordsOperationResult

Ƭ **AddToRelatedRecordsOperationResult**: `undefined`

#### Defined in

[packages/@orbit/records/src/record-operation.ts:115](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation.ts#L115)

___

### AsyncRecordQueryable

Ƭ **AsyncRecordQueryable**<`ResponseDetails`, `QueryBuilder`, `QueryOptions`\>: `AsyncQueryable`<[`RecordQueryResult`](modules.md#recordqueryresult), `ResponseDetails`, [`RecordOperation`](modules.md#recordoperation), [`RecordQueryExpression`](modules.md#recordqueryexpression), `QueryBuilder`, `QueryOptions`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResponseDetails` | `ResponseDetails` |
| `QueryBuilder` | [`RecordQueryBuilder`](classes/RecordQueryBuilder.md) |
| `QueryOptions` | extends `RequestOptions``RequestOptions` |

#### Defined in

[packages/@orbit/records/src/record-queryable.ts:20](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-queryable.ts#L20)

___

### AsyncRecordUpdatable

Ƭ **AsyncRecordUpdatable**<`ResponseDetails`, `TransformBuilder`, `TransformOptions`\>: `AsyncUpdatable`<[`RecordTransformResult`](modules.md#recordtransformresult), `ResponseDetails`, [`RecordOperation`](modules.md#recordoperation), `TransformBuilder`, `TransformOptions`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResponseDetails` | `ResponseDetails` |
| `TransformBuilder` | [`RecordTransformBuilder`](classes/RecordTransformBuilder.md) |
| `TransformOptions` | extends `RequestOptions``RequestOptions` |

#### Defined in

[packages/@orbit/records/src/record-updatable.ts:18](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-updatable.ts#L18)

___

### FilterParam

Ƭ **FilterParam**<`RI`\>: [`FilterSpecifier`](modules.md#filterspecifier) \| [`AttributeFilterParam`](interfaces/AttributeFilterParam.md) \| [`RelatedRecordFilterParam`](interfaces/RelatedRecordFilterParam.md)<`RI`\> \| [`RelatedRecordsFilterParam`](interfaces/RelatedRecordsFilterParam.md)<`RI`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RI` | [`RecordIdentity`](interfaces/RecordIdentity.md) |

#### Defined in

[packages/@orbit/records/src/record-query-term.ts:57](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-term.ts#L57)

___

### FilterSpecifier

Ƭ **FilterSpecifier**: [`BaseFilterSpecifier`](interfaces/BaseFilterSpecifier.md) \| [`AttributeFilterSpecifier`](interfaces/AttributeFilterSpecifier.md) \| [`RelatedRecordFilterSpecifier`](interfaces/RelatedRecordFilterSpecifier.md) \| [`RelatedRecordsFilterSpecifier`](interfaces/RelatedRecordsFilterSpecifier.md)

#### Defined in

[packages/@orbit/records/src/record-query-expression.ts:47](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-expression.ts#L47)

___

### FindRecordResult

Ƭ **FindRecordResult**: [`InitializedRecord`](interfaces/InitializedRecord.md) \| `undefined`

#### Defined in

[packages/@orbit/records/src/record-query-expression.ts:100](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-expression.ts#L100)

___

### FindRecordsResult

Ƭ **FindRecordsResult**: [`InitializedRecord`](interfaces/InitializedRecord.md)[]

#### Defined in

[packages/@orbit/records/src/record-query-expression.ts:103](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-expression.ts#L103)

___

### FindRelatedRecordResult

Ƭ **FindRelatedRecordResult**: [`InitializedRecord`](interfaces/InitializedRecord.md) \| ``null`` \| `undefined`

#### Defined in

[packages/@orbit/records/src/record-query-expression.ts:101](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-expression.ts#L101)

___

### FindRelatedRecordsResult

Ƭ **FindRelatedRecordsResult**: [`InitializedRecord`](interfaces/InitializedRecord.md)[] \| `undefined`

#### Defined in

[packages/@orbit/records/src/record-query-expression.ts:102](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-expression.ts#L102)

___

### Link

Ƭ **Link**: `string` \| [`LinkObject`](interfaces/LinkObject.md)

#### Defined in

[packages/@orbit/records/src/record.ts:8](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record.ts#L8)

___

### PageSpecifier

Ƭ **PageSpecifier**: [`BasePageSpecifier`](interfaces/BasePageSpecifier.md) \| [`OffsetLimitPageSpecifier`](interfaces/OffsetLimitPageSpecifier.md)

#### Defined in

[packages/@orbit/records/src/record-query-expression.ts:63](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-expression.ts#L63)

___

### RecordAttributeValidationIssue

Ƭ **RecordAttributeValidationIssue**: `TypeIssue` \| [`RecordFieldDefinitionIssue`](interfaces/RecordFieldDefinitionIssue.md) \| `ValueRequiredIssue` \| `ValueNotNullIssue` \| `ValueValidIssue`

#### Defined in

[packages/@orbit/records/src/record-validators/record-attribute-validator.ts:51](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/record-attribute-validator.ts#L51)

___

### RecordAttributeValidator

Ƭ **RecordAttributeValidator**: `Validator`<[`RecordAttributeInput`](interfaces/RecordAttributeInput.md), [`RecordAttributeValidationOptions`](interfaces/RecordAttributeValidationOptions.md), [`RecordAttributeValidationIssue`](modules.md#recordattributevalidationissue)\>

#### Defined in

[packages/@orbit/records/src/record-validators/record-attribute-validator.ts:64](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/record-attribute-validator.ts#L64)

___

### RecordFieldDefinitionValidator

Ƭ **RecordFieldDefinitionValidator**: `Validator`<[`RecordFieldDefinitionInput`](interfaces/RecordFieldDefinitionInput.md), [`RecordFieldDefinitionValidationOptions`](interfaces/RecordFieldDefinitionValidationOptions.md), [`RecordFieldDefinitionIssue`](interfaces/RecordFieldDefinitionIssue.md)\>

#### Defined in

[packages/@orbit/records/src/record-validators/record-field-definition-validator.ts:22](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/record-field-definition-validator.ts#L22)

___

### RecordIdentityValidationIssue

Ƭ **RecordIdentityValidationIssue**: `TypeIssue` \| [`RecordTypeValidationIssue`](modules.md#recordtypevalidationissue)

#### Defined in

[packages/@orbit/records/src/record-validators/record-identity-validator.ts:28](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/record-identity-validator.ts#L28)

___

### RecordIdentityValidator

Ƭ **RecordIdentityValidator**: `Validator`<[`RecordIdentity`](interfaces/RecordIdentity.md), [`RecordIdentityValidationOptions`](interfaces/RecordIdentityValidationOptions.md), [`RecordIdentityValidationIssue`](modules.md#recordidentityvalidationissue)\>

#### Defined in

[packages/@orbit/records/src/record-validators/record-identity-validator.ts:38](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/record-identity-validator.ts#L38)

___

### RecordKeyValidationIssue

Ƭ **RecordKeyValidationIssue**: [`RecordFieldDefinitionIssue`](interfaces/RecordFieldDefinitionIssue.md) \| `ValueRequiredIssue` \| `ValueNotNullIssue` \| `ValueValidIssue`

#### Defined in

[packages/@orbit/records/src/record-validators/record-key-validator.ts:46](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/record-key-validator.ts#L46)

___

### RecordKeyValidator

Ƭ **RecordKeyValidator**: `Validator`<[`RecordKeyInput`](interfaces/RecordKeyInput.md), [`RecordKeyValidationOptions`](interfaces/RecordKeyValidationOptions.md), [`RecordKeyValidationIssue`](modules.md#recordkeyvalidationissue)\>

#### Defined in

[packages/@orbit/records/src/record-validators/record-key-validator.ts:58](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/record-key-validator.ts#L58)

___

### RecordOperation

Ƭ **RecordOperation**: [`AddRecordOperation`](interfaces/AddRecordOperation.md) \| [`UpdateRecordOperation`](interfaces/UpdateRecordOperation.md) \| [`RemoveRecordOperation`](interfaces/RemoveRecordOperation.md) \| [`ReplaceKeyOperation`](interfaces/ReplaceKeyOperation.md) \| [`ReplaceAttributeOperation`](interfaces/ReplaceAttributeOperation.md) \| [`AddToRelatedRecordsOperation`](interfaces/AddToRelatedRecordsOperation.md) \| [`RemoveFromRelatedRecordsOperation`](interfaces/RemoveFromRelatedRecordsOperation.md) \| [`ReplaceRelatedRecordsOperation`](interfaces/ReplaceRelatedRecordsOperation.md) \| [`ReplaceRelatedRecordOperation`](interfaces/ReplaceRelatedRecordOperation.md)

Union of all record-related operations.

#### Defined in

[packages/@orbit/records/src/record-operation.ts:99](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation.ts#L99)

___

### RecordOperationResult

Ƭ **RecordOperationResult**<`T`\>: `T` \| `undefined`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | [`InitializedRecord`](interfaces/InitializedRecord.md) |

#### Defined in

[packages/@orbit/records/src/record-operation.ts:120](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation.ts#L120)

___

### RecordOperationTerm

Ƭ **RecordOperationTerm**<`RT`, `RI`, `R`\>: [`AddRecordTerm`](classes/AddRecordTerm.md)<`RT`, `RI`, `R`\> \| [`UpdateRecordTerm`](classes/UpdateRecordTerm.md)<`RT`, `RI`, `R`\> \| [`RemoveRecordTerm`](classes/RemoveRecordTerm.md)<`RT`, `RI`, `R`\> \| [`ReplaceKeyTerm`](classes/ReplaceKeyTerm.md)<`RT`, `RI`, `R`\> \| [`ReplaceAttributeTerm`](classes/ReplaceAttributeTerm.md)<`RT`, `RI`, `R`\> \| [`AddToRelatedRecordsTerm`](classes/AddToRelatedRecordsTerm.md)<`RT`, `RI`, `R`\> \| [`RemoveFromRelatedRecordsTerm`](classes/RemoveFromRelatedRecordsTerm.md)<`RT`, `RI`, `R`\> \| [`ReplaceRelatedRecordsTerm`](classes/ReplaceRelatedRecordsTerm.md)<`RT`, `RI`, `R`\> \| [`ReplaceRelatedRecordTerm`](classes/ReplaceRelatedRecordTerm.md)<`RT`, `RI`, `R`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RT` | `string` |
| `RI` | [`RecordIdentity`](interfaces/RecordIdentity.md) |
| `R` | [`UninitializedRecord`](interfaces/UninitializedRecord.md) |

#### Defined in

[packages/@orbit/records/src/record-operation-term.ts:241](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation-term.ts#L241)

___

### RecordOperationValidationIssue

Ƭ **RecordOperationValidationIssue**: `OperationAllowedIssue` \| `OperationValidIssue`

#### Defined in

[packages/@orbit/records/src/record-validators/record-operation-validator.ts:43](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/record-operation-validator.ts#L43)

___

### RecordOperationValidator

Ƭ **RecordOperationValidator**: `Validator`<[`RecordOperation`](modules.md#recordoperation), [`RecordOperationValidationOptions`](interfaces/RecordOperationValidationOptions.md), [`RecordOperationValidationIssue`](modules.md#recordoperationvalidationissue)\>

#### Defined in

[packages/@orbit/records/src/record-validators/record-operation-validator.ts:47](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/record-operation-validator.ts#L47)

___

### RecordPullable

Ƭ **RecordPullable**<`ResponseDetails`\>: `Pullable`<[`RecordQueryResult`](modules.md#recordqueryresult), `ResponseDetails`, [`RecordOperation`](modules.md#recordoperation), [`RecordQueryExpression`](modules.md#recordqueryexpression), [`RecordQueryBuilder`](classes/RecordQueryBuilder.md)\>

#### Type parameters

| Name |
| :------ |
| `ResponseDetails` |

#### Defined in

[packages/@orbit/records/src/record-source-interfaces/record-pullable.ts:7](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-source-interfaces/record-pullable.ts#L7)

___

### RecordPushable

Ƭ **RecordPushable**<`ResponseDetails`\>: `Pushable`<[`RecordTransformResult`](modules.md#recordtransformresult), `ResponseDetails`, [`RecordOperation`](modules.md#recordoperation), [`RecordTransformBuilder`](classes/RecordTransformBuilder.md)\>

#### Type parameters

| Name |
| :------ |
| `ResponseDetails` |

#### Defined in

[packages/@orbit/records/src/record-source-interfaces/record-pushable.ts:6](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-source-interfaces/record-pushable.ts#L6)

___

### RecordQuery

Ƭ **RecordQuery**: `Query`<[`RecordQueryExpression`](modules.md#recordqueryexpression)\>

#### Defined in

[packages/@orbit/records/src/record-query.ts:8](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query.ts#L8)

___

### RecordQueryBuilderFunc

Ƭ **RecordQueryBuilderFunc**: `QueryBuilderFunc`<[`RecordQueryExpression`](modules.md#recordqueryexpression), [`RecordQueryBuilder`](classes/RecordQueryBuilder.md)\>

#### Defined in

[packages/@orbit/records/src/record-query-builder.ts:21](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-builder.ts#L21)

___

### RecordQueryExpression

Ƭ **RecordQueryExpression**: [`FindRecord`](interfaces/FindRecord.md) \| [`FindRelatedRecord`](interfaces/FindRelatedRecord.md) \| [`FindRelatedRecords`](interfaces/FindRelatedRecords.md) \| [`FindRecords`](interfaces/FindRecords.md)

#### Defined in

[packages/@orbit/records/src/record-query-expression.ts:94](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-expression.ts#L94)

___

### RecordQueryExpressionResult

Ƭ **RecordQueryExpressionResult**<`T`\>: `T` \| `T`[] \| ``null`` \| `undefined`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | [`InitializedRecord`](interfaces/InitializedRecord.md) |

#### Defined in

[packages/@orbit/records/src/record-query-expression.ts:105](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-expression.ts#L105)

___

### RecordQueryResult

Ƭ **RecordQueryResult**<`T`\>: [`RecordQueryExpressionResult`](modules.md#recordqueryexpressionresult)<`T`\> \| [`RecordQueryExpressionResult`](modules.md#recordqueryexpressionresult)<`T`\>[]

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | [`InitializedRecord`](interfaces/InitializedRecord.md) |

#### Defined in

[packages/@orbit/records/src/record-query.ts:10](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query.ts#L10)

___

### RecordQueryTerm

Ƭ **RecordQueryTerm**<`RT`, `RI`\>: [`FindRecordTerm`](classes/FindRecordTerm.md)<`RT`, `RI`\> \| [`FindRelatedRecordTerm`](classes/FindRelatedRecordTerm.md)<`RT`, `RI`\> \| [`FindRecordsTerm`](classes/FindRecordsTerm.md)<`RT`, `RI`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RT` | `string` |
| `RI` | [`RecordIdentity`](interfaces/RecordIdentity.md) |

#### Defined in

[packages/@orbit/records/src/record-query-term.ts:344](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-term.ts#L344)

___

### RecordQueryable

Ƭ **RecordQueryable**<`ResponseDetails`, `QueryBuilder`, `QueryOptions`\>: `Queryable`<[`RecordQueryResult`](modules.md#recordqueryresult), `ResponseDetails`, [`RecordOperation`](modules.md#recordoperation), [`RecordQueryExpression`](modules.md#recordqueryexpression), `QueryBuilder`, `QueryOptions`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResponseDetails` | `ResponseDetails` |
| `QueryBuilder` | [`RecordQueryBuilder`](classes/RecordQueryBuilder.md) |
| `QueryOptions` | extends `RequestOptions``RequestOptions` |

#### Defined in

[packages/@orbit/records/src/record-source-interfaces/record-queryable.ts:7](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-source-interfaces/record-queryable.ts#L7)

___

### RecordRelationship

Ƭ **RecordRelationship**: [`RecordHasOneRelationship`](interfaces/RecordHasOneRelationship.md) \| [`RecordHasManyRelationship`](interfaces/RecordHasManyRelationship.md)

#### Defined in

[packages/@orbit/records/src/record.ts:27](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record.ts#L27)

___

### RecordRelationshipValidationIssue

Ƭ **RecordRelationshipValidationIssue**: [`RecordFieldDefinitionIssue`](interfaces/RecordFieldDefinitionIssue.md) \| `RequiredIssue` \| `NotNullIssue` \| `DataValidIssue`

#### Defined in

[packages/@orbit/records/src/record-validators/record-relationship-validator.ts:50](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/record-relationship-validator.ts#L50)

___

### RecordRelationshipValidator

Ƭ **RecordRelationshipValidator**: `Validator`<[`RecordRelationshipInput`](interfaces/RecordRelationshipInput.md), [`RecordRelationshipValidationOptions`](interfaces/RecordRelationshipValidationOptions.md), [`RecordRelationshipValidationIssue`](modules.md#recordrelationshipvalidationissue)\>

#### Defined in

[packages/@orbit/records/src/record-validators/record-relationship-validator.ts:62](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/record-relationship-validator.ts#L62)

___

### RecordSchemaEvent

Ƭ **RecordSchemaEvent**: ``"upgrade"``

#### Defined in

[packages/@orbit/records/src/record-schema.ts:103](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-schema.ts#L103)

___

### RecordSourceClass

Ƭ **RecordSourceClass**<`QO`, `TO`, `QB`, `TB`\>: `SourceClass`<`QO`, `TO`, `QB`, `TB`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `QO` | extends `RequestOptions`[`RecordSourceQueryOptions`](interfaces/RecordSourceQueryOptions.md) |
| `TO` | extends `RequestOptions``RequestOptions` |
| `QB` | [`RecordQueryBuilder`](classes/RecordQueryBuilder.md) |
| `TB` | [`RecordTransformBuilder`](classes/RecordTransformBuilder.md) |

#### Defined in

[packages/@orbit/records/src/record-source.ts:39](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-source.ts#L39)

___

### RecordSyncable

Ƭ **RecordSyncable**: `Syncable`<[`RecordOperation`](modules.md#recordoperation), [`RecordTransformBuilder`](classes/RecordTransformBuilder.md)\>

#### Defined in

[packages/@orbit/records/src/record-source-interfaces/record-syncable.ts:5](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-source-interfaces/record-syncable.ts#L5)

___

### RecordTransform

Ƭ **RecordTransform**: `Transform`<[`RecordOperation`](modules.md#recordoperation)\>

#### Defined in

[packages/@orbit/records/src/record-transform.ts:5](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-transform.ts#L5)

___

### RecordTransformBuilderFunc

Ƭ **RecordTransformBuilderFunc**: `TransformBuilderFunc`<[`RecordOperation`](modules.md#recordoperation), [`RecordTransformBuilder`](classes/RecordTransformBuilder.md)\>

#### Defined in

[packages/@orbit/records/src/record-transform-builder.ts:28](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-transform-builder.ts#L28)

___

### RecordTransformResult

Ƭ **RecordTransformResult**<`T`\>: [`RecordOperationResult`](modules.md#recordoperationresult)<`T`\> \| [`RecordOperationResult`](modules.md#recordoperationresult)<`T`\>[]

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | [`InitializedRecord`](interfaces/InitializedRecord.md) |

#### Defined in

[packages/@orbit/records/src/record-transform.ts:7](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-transform.ts#L7)

___

### RecordTypeValidationIssue

Ƭ **RecordTypeValidationIssue**: `TypeIssue` \| `RecordTypeDefined`

#### Defined in

[packages/@orbit/records/src/record-validators/record-type-validator.ts:19](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/record-type-validator.ts#L19)

___

### RecordTypeValidator

Ƭ **RecordTypeValidator**: `Validator`<`string`, [`RecordTypeValidationOptions`](interfaces/RecordTypeValidationOptions.md), [`RecordTypeValidationIssue`](modules.md#recordtypevalidationissue)\>

#### Defined in

[packages/@orbit/records/src/record-validators/record-type-validator.ts:25](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/record-type-validator.ts#L25)

___

### RecordUpdatable

Ƭ **RecordUpdatable**<`ResponseDetails`, `TransformBuilder`, `TransformOptions`\>: `Updatable`<[`RecordTransformResult`](modules.md#recordtransformresult), `ResponseDetails`, [`RecordOperation`](modules.md#recordoperation), `TransformBuilder`, `TransformOptions`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResponseDetails` | `ResponseDetails` |
| `TransformBuilder` | [`RecordTransformBuilder`](classes/RecordTransformBuilder.md) |
| `TransformOptions` | extends `RequestOptions``RequestOptions` |

#### Defined in

[packages/@orbit/records/src/record-source-interfaces/record-updatable.ts:6](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-source-interfaces/record-updatable.ts#L6)

___

### RecordValidationIssue

Ƭ **RecordValidationIssue**: [`RecordIdentityValidationIssue`](modules.md#recordidentityvalidationissue) \| [`RecordKeyValidationIssue`](modules.md#recordkeyvalidationissue) \| [`RecordAttributeValidationIssue`](modules.md#recordattributevalidationissue) \| [`RecordRelationshipValidationIssue`](modules.md#recordrelationshipvalidationissue)

#### Defined in

[packages/@orbit/records/src/record-validators/record-validator.ts:30](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/record-validator.ts#L30)

___

### RecordValidator

Ƭ **RecordValidator**: `Validator`<[`InitializedRecord`](interfaces/InitializedRecord.md), [`RecordValidationOptions`](interfaces/RecordValidationOptions.md), [`RecordValidationIssue`](modules.md#recordvalidationissue)\>

#### Defined in

[packages/@orbit/records/src/record-validators/record-validator.ts:43](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/record-validator.ts#L43)

___

### RelatedRecordValidationIssue

Ƭ **RelatedRecordValidationIssue**: [`RecordFieldDefinitionIssue`](interfaces/RecordFieldDefinitionIssue.md) \| `RelatedRecordValidIssue` \| `RelatedRecordTypeIssue`

#### Defined in

[packages/@orbit/records/src/record-validators/related-record-validator.ts:47](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/related-record-validator.ts#L47)

___

### RelatedRecordValidator

Ƭ **RelatedRecordValidator**: `Validator`<[`RelatedRecordInput`](interfaces/RelatedRecordInput.md), [`RelatedRecordValidationOptions`](interfaces/RelatedRecordValidationOptions.md), [`RelatedRecordValidationIssue`](modules.md#relatedrecordvalidationissue)\>

#### Defined in

[packages/@orbit/records/src/record-validators/related-record-validator.ts:58](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/related-record-validator.ts#L58)

___

### RelationshipDefinition

Ƭ **RelationshipDefinition**: [`HasOneRelationshipDefinition`](interfaces/HasOneRelationshipDefinition.md) \| [`HasManyRelationshipDefinition`](interfaces/HasManyRelationshipDefinition.md)

#### Defined in

[packages/@orbit/records/src/record-schema.ts:51](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-schema.ts#L51)

___

### RemoveFromRelatedRecordsOperationResult

Ƭ **RemoveFromRelatedRecordsOperationResult**: `undefined`

#### Defined in

[packages/@orbit/records/src/record-operation.ts:116](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation.ts#L116)

___

### RemoveRecordOperationResult

Ƭ **RemoveRecordOperationResult**: `undefined`

#### Defined in

[packages/@orbit/records/src/record-operation.ts:112](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation.ts#L112)

___

### ReplaceAttributeOperationResult

Ƭ **ReplaceAttributeOperationResult**: `undefined`

#### Defined in

[packages/@orbit/records/src/record-operation.ts:114](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation.ts#L114)

___

### ReplaceKeyOperationResult

Ƭ **ReplaceKeyOperationResult**: `undefined`

#### Defined in

[packages/@orbit/records/src/record-operation.ts:113](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation.ts#L113)

___

### ReplaceRelatedRecordOperationResult

Ƭ **ReplaceRelatedRecordOperationResult**: `undefined`

#### Defined in

[packages/@orbit/records/src/record-operation.ts:118](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation.ts#L118)

___

### ReplaceRelatedRecordsOperationResult

Ƭ **ReplaceRelatedRecordsOperationResult**: `undefined`

#### Defined in

[packages/@orbit/records/src/record-operation.ts:117](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation.ts#L117)

___

### SetComparisonOperator

Ƭ **SetComparisonOperator**: ``"equal"`` \| ``"all"`` \| ``"some"`` \| ``"none"``

#### Defined in

[packages/@orbit/records/src/record-query-expression.ts:19](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-expression.ts#L19)

___

### SortOrder

Ƭ **SortOrder**: ``"ascending"`` \| ``"descending"``

#### Defined in

[packages/@orbit/records/src/record-query-expression.ts:4](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-expression.ts#L4)

___

### SortParam

Ƭ **SortParam**: [`SortSpecifier`](modules.md#sortspecifier) \| [`AttributeSortParam`](interfaces/AttributeSortParam.md) \| `string`

#### Defined in

[packages/@orbit/records/src/record-query-term.ts:32](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-term.ts#L32)

___

### SortSpecifier

Ƭ **SortSpecifier**: [`BaseSortSpecifier`](interfaces/BaseSortSpecifier.md) \| [`AttributeSortSpecifier`](interfaces/AttributeSortSpecifier.md)

#### Defined in

[packages/@orbit/records/src/record-query-expression.ts:16](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-expression.ts#L16)

___

### StandardRecordValidator

Ƭ **StandardRecordValidator**: [`RecordValidator`](modules.md#recordvalidator) \| [`RecordAttributeValidator`](modules.md#recordattributevalidator) \| [`RecordIdentityValidator`](modules.md#recordidentityvalidator) \| [`RecordKeyValidator`](modules.md#recordkeyvalidator) \| [`RecordOperationValidator`](modules.md#recordoperationvalidator) \| `RecordQueryExpressionValidator` \| [`RecordRelationshipValidator`](modules.md#recordrelationshipvalidator) \| [`RecordTypeValidator`](modules.md#recordtypevalidator) \| [`RelatedRecordValidator`](modules.md#relatedrecordvalidator) \| [`RecordFieldDefinitionValidator`](modules.md#recordfielddefinitionvalidator)

#### Defined in

[packages/@orbit/records/src/record-validators/standard-record-validators.ts:25](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/standard-record-validators.ts#L25)

___

### SyncRecordQueryable

Ƭ **SyncRecordQueryable**<`ResponseDetails`, `QueryBuilder`, `QueryOptions`\>: `SyncQueryable`<[`RecordQueryResult`](modules.md#recordqueryresult), `ResponseDetails`, [`RecordOperation`](modules.md#recordoperation), [`RecordQueryExpression`](modules.md#recordqueryexpression), `QueryBuilder`, `QueryOptions`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResponseDetails` | `ResponseDetails` |
| `QueryBuilder` | [`RecordQueryBuilder`](classes/RecordQueryBuilder.md) |
| `QueryOptions` | extends `RequestOptions``RequestOptions` |

#### Defined in

[packages/@orbit/records/src/record-queryable.ts:7](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-queryable.ts#L7)

___

### SyncRecordUpdatable

Ƭ **SyncRecordUpdatable**<`ResponseDetails`, `TransformBuilder`, `TransformOptions`\>: `SyncUpdatable`<[`RecordTransformResult`](modules.md#recordtransformresult), `ResponseDetails`, [`RecordOperation`](modules.md#recordoperation), `TransformBuilder`, `TransformOptions`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResponseDetails` | `ResponseDetails` |
| `TransformBuilder` | [`RecordTransformBuilder`](classes/RecordTransformBuilder.md) |
| `TransformOptions` | extends `RequestOptions``RequestOptions` |

#### Defined in

[packages/@orbit/records/src/record-updatable.ts:6](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-updatable.ts#L6)

___

### UpdateRecordOperationResult

Ƭ **UpdateRecordOperationResult**: `undefined`

#### Defined in

[packages/@orbit/records/src/record-operation.ts:111](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation.ts#L111)

___

### ValueComparisonOperator

Ƭ **ValueComparisonOperator**: ``"equal"`` \| ``"gt"`` \| ``"lt"`` \| ``"gte"`` \| ``"lte"``

#### Defined in

[packages/@orbit/records/src/record-query-expression.ts:18](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-query-expression.ts#L18)

## Variables

### standardRecordValidators

• `Const` **standardRecordValidators**: `Dict`<[`StandardRecordValidator`](modules.md#standardrecordvalidator)\>

#### Defined in

[packages/@orbit/records/src/record-validators/standard-record-validator-dict.ts:14](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/standard-record-validator-dict.ts#L14)

## Functions

### buildRecordValidatorFor

▸ **buildRecordValidatorFor**<`V`\>(`settings?`): `ValidatorForFn`<`V`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `V` | `Validator`<`unknown`[], `ArrayValidationOptions`, `ArrayValidationIssue`\> \| `Validator`<`boolean`, `undefined`, `TypeIssue`\> \| `Validator`<`Date`, `DateValidationOptions`, `DateValidationIssue`\> \| `Validator`<`number`, `NumberValidationOptions`, `NumberValidationIssue`\> \| `Validator`<`unknown`, `ValidationOptions`, `TypeIssue`\> \| `Validator`<`string`, `StringValidationOptions`, `StringValidationIssue`\> \| `Validator`<[`InitializedRecord`](interfaces/InitializedRecord.md), [`RecordValidationOptions`](interfaces/RecordValidationOptions.md), [`RecordValidationIssue`](modules.md#recordvalidationissue)\> \| `Validator`<[`RecordAttributeInput`](interfaces/RecordAttributeInput.md), [`RecordAttributeValidationOptions`](interfaces/RecordAttributeValidationOptions.md), [`RecordAttributeValidationIssue`](modules.md#recordattributevalidationissue)\> \| `Validator`<[`RecordIdentity`](interfaces/RecordIdentity.md), [`RecordIdentityValidationOptions`](interfaces/RecordIdentityValidationOptions.md), [`RecordIdentityValidationIssue`](modules.md#recordidentityvalidationissue)\> \| `Validator`<[`RecordKeyInput`](interfaces/RecordKeyInput.md), [`RecordKeyValidationOptions`](interfaces/RecordKeyValidationOptions.md), [`RecordKeyValidationIssue`](modules.md#recordkeyvalidationissue)\> \| `Validator`<[`RecordOperation`](modules.md#recordoperation), [`RecordOperationValidationOptions`](interfaces/RecordOperationValidationOptions.md), [`RecordOperationValidationIssue`](modules.md#recordoperationvalidationissue)\> \| `Validator`<[`RecordQueryExpression`](modules.md#recordqueryexpression), `RecordQueryExpressionValidationOptions`, `RecordQueryExpressionValidationIssue`\> \| `Validator`<[`RecordRelationshipInput`](interfaces/RecordRelationshipInput.md), [`RecordRelationshipValidationOptions`](interfaces/RecordRelationshipValidationOptions.md), [`RecordRelationshipValidationIssue`](modules.md#recordrelationshipvalidationissue)\> \| `Validator`<`string`, [`RecordTypeValidationOptions`](interfaces/RecordTypeValidationOptions.md), [`RecordTypeValidationIssue`](modules.md#recordtypevalidationissue)\> \| `Validator`<[`RelatedRecordInput`](interfaces/RelatedRecordInput.md), [`RelatedRecordValidationOptions`](interfaces/RelatedRecordValidationOptions.md), [`RelatedRecordValidationIssue`](modules.md#relatedrecordvalidationissue)\> \| `Validator`<[`RecordFieldDefinitionInput`](interfaces/RecordFieldDefinitionInput.md), [`RecordFieldDefinitionValidationOptions`](interfaces/RecordFieldDefinitionValidationOptions.md), [`RecordFieldDefinitionIssue`](interfaces/RecordFieldDefinitionIssue.md)\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings?` | `Object` |
| `settings.validators?` | `Dict`<`V`\> |

#### Returns

`ValidatorForFn`<`V`\>

#### Defined in

[packages/@orbit/records/src/record-validators/record-validator-builder.ts:11](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/record-validator-builder.ts#L11)

___

### cloneRecordIdentity

▸ **cloneRecordIdentity**(`identity`): [`RecordIdentity`](interfaces/RecordIdentity.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `identity` | [`RecordIdentity`](interfaces/RecordIdentity.md) |

#### Returns

[`RecordIdentity`](interfaces/RecordIdentity.md)

#### Defined in

[packages/@orbit/records/src/record.ts:64](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record.ts#L64)

___

### coalesceRecordOperations

▸ **coalesceRecordOperations**(`operations`): [`RecordOperation`](modules.md#recordoperation)[]

Coalesces operations into a minimal set of equivalent operations.

This method respects the order of the operations array and does not allow
reordering of operations that affect relationships.

#### Parameters

| Name | Type |
| :------ | :------ |
| `operations` | [`RecordOperation`](modules.md#recordoperation)[] |

#### Returns

[`RecordOperation`](modules.md#recordoperation)[]

#### Defined in

[packages/@orbit/records/src/record-operation.ts:393](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation.ts#L393)

___

### dedupeRecordIdentities

▸ **dedupeRecordIdentities**(`recordIdentities`): [`RecordIdentity`](interfaces/RecordIdentity.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `recordIdentities` | [`RecordIdentity`](interfaces/RecordIdentity.md)[] |

#### Returns

[`RecordIdentity`](interfaces/RecordIdentity.md)[]

#### Defined in

[packages/@orbit/records/src/record.ts:112](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record.ts#L112)

___

### deserializeRecordIdentity

▸ **deserializeRecordIdentity**(`identity`): [`RecordIdentity`](interfaces/RecordIdentity.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `identity` | `string` |

#### Returns

[`RecordIdentity`](interfaces/RecordIdentity.md)

#### Defined in

[packages/@orbit/records/src/record.ts:224](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record.ts#L224)

___

### equalRecordIdentities

▸ **equalRecordIdentities**(`record1?`, `record2?`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `record1?` | [`RecordIdentity`](interfaces/RecordIdentity.md) \| ``null`` |
| `record2?` | [`RecordIdentity`](interfaces/RecordIdentity.md) \| ``null`` |

#### Returns

`boolean`

#### Defined in

[packages/@orbit/records/src/record.ts:69](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record.ts#L69)

___

### equalRecordIdentitySets

▸ **equalRecordIdentitySets**(`set1`, `set2`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `set1` | [`RecordIdentity`](interfaces/RecordIdentity.md)[] |
| `set2` | [`RecordIdentity`](interfaces/RecordIdentity.md)[] |

#### Returns

`boolean`

#### Defined in

[packages/@orbit/records/src/record.ts:82](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record.ts#L82)

___

### isRecordIdentity

▸ **isRecordIdentity**(`identity`): identity is RecordIdentity

#### Parameters

| Name | Type |
| :------ | :------ |
| `identity` | [`RecordIdentity`](interfaces/RecordIdentity.md) \| `unknown` |

#### Returns

identity is RecordIdentity

#### Defined in

[packages/@orbit/records/src/record.ts:213](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record.ts#L213)

___

### mergeRecords

▸ **mergeRecords**(`current`, `updates`): [`InitializedRecord`](interfaces/InitializedRecord.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `current` | [`InitializedRecord`](interfaces/InitializedRecord.md) \| ``null`` |
| `updates` | [`InitializedRecord`](interfaces/InitializedRecord.md) |

#### Returns

[`InitializedRecord`](interfaces/InitializedRecord.md)

#### Defined in

[packages/@orbit/records/src/record.ts:151](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record.ts#L151)

___

### recordDiffs

▸ **recordDiffs**(`record`, `updatedRecord`): [`RecordOperation`](modules.md#recordoperation)[]

Determine the differences between a record and its updated version in terms
of a set of operations.

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | [`InitializedRecord`](interfaces/InitializedRecord.md) |
| `updatedRecord` | [`InitializedRecord`](interfaces/InitializedRecord.md) |

#### Returns

[`RecordOperation`](modules.md#recordoperation)[]

#### Defined in

[packages/@orbit/records/src/record-operation.ts:420](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation.ts#L420)

___

### recordsInclude

▸ **recordsInclude**(`records`, `match`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `records` | [`RecordIdentity`](interfaces/RecordIdentity.md)[] |
| `match` | [`RecordIdentity`](interfaces/RecordIdentity.md) |

#### Returns

`boolean`

#### Defined in

[packages/@orbit/records/src/record.ts:127](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record.ts#L127)

___

### recordsIncludeAll

▸ **recordsIncludeAll**(`records`, `match`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `records` | [`RecordIdentity`](interfaces/RecordIdentity.md)[] |
| `match` | [`RecordIdentity`](interfaces/RecordIdentity.md)[] |

#### Returns

`boolean`

#### Defined in

[packages/@orbit/records/src/record.ts:139](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record.ts#L139)

___

### recordsReferencedByOperations

▸ **recordsReferencedByOperations**(`operations`): [`RecordIdentity`](interfaces/RecordIdentity.md)[]

Returns the deduped identities of all the records directly referenced by an
array of operations.

#### Parameters

| Name | Type |
| :------ | :------ |
| `operations` | [`RecordOperation`](modules.md#recordoperation)[] |

#### Returns

[`RecordIdentity`](interfaces/RecordIdentity.md)[]

#### Defined in

[packages/@orbit/records/src/record-operation.ts:509](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation.ts#L509)

___

### serializeRecordIdentity

▸ **serializeRecordIdentity**(`record`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | [`RecordIdentity`](interfaces/RecordIdentity.md) |

#### Returns

`string`

#### Defined in

[packages/@orbit/records/src/record.ts:220](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record.ts#L220)

___

### uniqueRecordIdentities

▸ **uniqueRecordIdentities**(`set1`, `set2`): [`RecordIdentity`](interfaces/RecordIdentity.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `set1` | [`RecordIdentity`](interfaces/RecordIdentity.md)[] |
| `set2` | [`RecordIdentity`](interfaces/RecordIdentity.md)[] |

#### Returns

[`RecordIdentity`](interfaces/RecordIdentity.md)[]

#### Defined in

[packages/@orbit/records/src/record.ts:102](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record.ts#L102)

___

### validateRecord

▸ `Const` **validateRecord**(`input`, `options?`): `undefined` \| [`RecordValidationIssue`](modules.md#recordvalidationissue)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `input` | [`InitializedRecord`](interfaces/InitializedRecord.md) |
| `options?` | [`RecordValidationOptions`](interfaces/RecordValidationOptions.md) |

#### Returns

`undefined` \| [`RecordValidationIssue`](modules.md#recordvalidationissue)[]

#### Defined in

[packages/@orbit/records/src/record-validators/record-validator.ts:49](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/record-validator.ts#L49)

___

### validateRecordAttribute

▸ `Const` **validateRecordAttribute**(`input`, `options?`): `undefined` \| [`RecordAttributeValidationIssue`](modules.md#recordattributevalidationissue)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `input` | [`RecordAttributeInput`](interfaces/RecordAttributeInput.md) |
| `options?` | [`RecordAttributeValidationOptions`](interfaces/RecordAttributeValidationOptions.md) |

#### Returns

`undefined` \| [`RecordAttributeValidationIssue`](modules.md#recordattributevalidationissue)[]

#### Defined in

[packages/@orbit/records/src/record-validators/record-attribute-validator.ts:70](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/record-attribute-validator.ts#L70)

___

### validateRecordFieldDefinition

▸ `Const` **validateRecordFieldDefinition**(`input`, `options?`): `undefined` \| [`RecordFieldDefinitionIssue`](interfaces/RecordFieldDefinitionIssue.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `input` | [`RecordFieldDefinitionInput`](interfaces/RecordFieldDefinitionInput.md) |
| `options?` | [`RecordFieldDefinitionValidationOptions`](interfaces/RecordFieldDefinitionValidationOptions.md) |

#### Returns

`undefined` \| [`RecordFieldDefinitionIssue`](interfaces/RecordFieldDefinitionIssue.md)[]

#### Defined in

[packages/@orbit/records/src/record-validators/record-field-definition-validator.ts:28](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/record-field-definition-validator.ts#L28)

___

### validateRecordIdentity

▸ `Const` **validateRecordIdentity**(`input`, `options?`): `undefined` \| [`RecordIdentityValidationIssue`](modules.md#recordidentityvalidationissue)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `input` | [`RecordIdentity`](interfaces/RecordIdentity.md) |
| `options?` | [`RecordIdentityValidationOptions`](interfaces/RecordIdentityValidationOptions.md) |

#### Returns

`undefined` \| [`RecordIdentityValidationIssue`](modules.md#recordidentityvalidationissue)[]

#### Defined in

[packages/@orbit/records/src/record-validators/record-identity-validator.ts:44](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/record-identity-validator.ts#L44)

___

### validateRecordKey

▸ `Const` **validateRecordKey**(`input`, `options?`): `undefined` \| [`RecordKeyValidationIssue`](modules.md#recordkeyvalidationissue)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `input` | [`RecordKeyInput`](interfaces/RecordKeyInput.md) |
| `options?` | [`RecordKeyValidationOptions`](interfaces/RecordKeyValidationOptions.md) |

#### Returns

`undefined` \| [`RecordKeyValidationIssue`](modules.md#recordkeyvalidationissue)[]

#### Defined in

[packages/@orbit/records/src/record-validators/record-key-validator.ts:64](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/record-key-validator.ts#L64)

___

### validateRecordOperation

▸ `Const` **validateRecordOperation**(`input`, `options?`): `undefined` \| [`RecordOperationValidationIssue`](modules.md#recordoperationvalidationissue)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `input` | [`RecordOperation`](modules.md#recordoperation) |
| `options?` | [`RecordOperationValidationOptions`](interfaces/RecordOperationValidationOptions.md) |

#### Returns

`undefined` \| [`RecordOperationValidationIssue`](modules.md#recordoperationvalidationissue)[]

#### Defined in

[packages/@orbit/records/src/record-validators/record-operation-validator.ts:53](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/record-operation-validator.ts#L53)

___

### validateRecordRelationship

▸ `Const` **validateRecordRelationship**(`input`, `options?`): `undefined` \| [`RecordRelationshipValidationIssue`](modules.md#recordrelationshipvalidationissue)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `input` | [`RecordRelationshipInput`](interfaces/RecordRelationshipInput.md) |
| `options?` | [`RecordRelationshipValidationOptions`](interfaces/RecordRelationshipValidationOptions.md) |

#### Returns

`undefined` \| [`RecordRelationshipValidationIssue`](modules.md#recordrelationshipvalidationissue)[]

#### Defined in

[packages/@orbit/records/src/record-validators/record-relationship-validator.ts:68](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/record-relationship-validator.ts#L68)

___

### validateRecordType

▸ `Const` **validateRecordType**(`input`, `options?`): `undefined` \| [`RecordTypeValidationIssue`](modules.md#recordtypevalidationissue)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `input` | `string` |
| `options?` | [`RecordTypeValidationOptions`](interfaces/RecordTypeValidationOptions.md) |

#### Returns

`undefined` \| [`RecordTypeValidationIssue`](modules.md#recordtypevalidationissue)[]

#### Defined in

[packages/@orbit/records/src/record-validators/record-type-validator.ts:31](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/record-type-validator.ts#L31)

___

### validateRelatedRecord

▸ `Const` **validateRelatedRecord**(`input`, `options?`): `undefined` \| [`RelatedRecordValidationIssue`](modules.md#relatedrecordvalidationissue)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `input` | [`RelatedRecordInput`](interfaces/RelatedRecordInput.md) |
| `options?` | [`RelatedRecordValidationOptions`](interfaces/RelatedRecordValidationOptions.md) |

#### Returns

`undefined` \| [`RelatedRecordValidationIssue`](modules.md#relatedrecordvalidationissue)[]

#### Defined in

[packages/@orbit/records/src/record-validators/related-record-validator.ts:64](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/related-record-validator.ts#L64)
