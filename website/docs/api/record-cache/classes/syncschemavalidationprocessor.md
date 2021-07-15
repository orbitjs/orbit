---
id: "SyncSchemaValidationProcessor"
title: "Class: SyncSchemaValidationProcessor"
sidebar_label: "SyncSchemaValidationProcessor"
sidebar_position: 0
custom_edit_url: null
---

An operation processor that ensures that an operation is compatible with
its associated schema.

## Hierarchy

- [`SyncOperationProcessor`](SyncOperationProcessor.md)

  ↳ **`SyncSchemaValidationProcessor`**

## Constructors

### constructor

• **new SyncSchemaValidationProcessor**(`accessor`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `accessor` | [`SyncRecordAccessor`](../interfaces/SyncRecordAccessor.md) |

#### Overrides

[SyncOperationProcessor](SyncOperationProcessor.md).[constructor](SyncOperationProcessor.md#constructor)

#### Defined in

[record-cache/src/operation-processors/sync-schema-validation-processor.ts:22](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/operation-processors/sync-schema-validation-processor.ts#L22)

## Properties

### schema

• **schema**: `RecordSchema`

#### Defined in

[record-cache/src/operation-processors/sync-schema-validation-processor.ts:19](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/operation-processors/sync-schema-validation-processor.ts#L19)

___

### validatorFor

• **validatorFor**: `ValidatorForFn`<`Validator`<`unknown`[], `ArrayValidationOptions`, `ArrayValidationIssue`\> \| `Validator`<`boolean`, `undefined`, `TypeIssue`\> \| `Validator`<`Date`, `DateValidationOptions`, `DateValidationIssue`\> \| `Validator`<`number`, `NumberValidationOptions`, `NumberValidationIssue`\> \| `Validator`<`unknown`, `ValidationOptions`, `TypeIssue`\> \| `Validator`<`string`, `StringValidationOptions`, `StringValidationIssue`\> \| `Validator`<`InitializedRecord`, `RecordValidationOptions`, `RecordValidationIssue`\> \| `Validator`<`RecordAttributeInput`, `RecordAttributeValidationOptions`, `RecordAttributeValidationIssue`\> \| `Validator`<`RecordIdentity`, `RecordIdentityValidationOptions`, `RecordIdentityValidationIssue`\> \| `Validator`<`RecordKeyInput`, `RecordKeyValidationOptions`, `RecordKeyValidationIssue`\> \| `Validator`<`RecordOperation`, `RecordOperationValidationOptions`, `RecordOperationValidationIssue`\> \| `Validator`<`RecordQueryExpression`, `RecordQueryExpressionValidationOptions`, `RecordQueryExpressionValidationIssue`\> \| `Validator`<`RecordRelationshipInput`, `RecordRelationshipValidationOptions`, `RecordRelationshipValidationIssue`\> \| `Validator`<`string`, `RecordTypeValidationOptions`, `RecordTypeValidationIssue`\> \| `Validator`<`RelatedRecordInput`, `RelatedRecordValidationOptions`, `RelatedRecordValidationIssue`\> \| `Validator`<`RecordFieldDefinitionInput`, `RecordFieldDefinitionValidationOptions`, `RecordFieldDefinitionIssue`\>\>

#### Defined in

[record-cache/src/operation-processors/sync-schema-validation-processor.ts:20](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/operation-processors/sync-schema-validation-processor.ts#L20)

## Accessors

### accessor

• `get` **accessor**(): [`SyncRecordAccessor`](../interfaces/SyncRecordAccessor.md)

The `SyncRecordAccessor` that is monitored.

#### Returns

[`SyncRecordAccessor`](../interfaces/SyncRecordAccessor.md)

#### Defined in

[record-cache/src/sync-operation-processor.ts:23](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-operation-processor.ts#L23)

## Methods

### after

▸ **after**(`operation`): `RecordOperation`[]

Called before an `operation` has been applied.

Returns an array of operations to be applied **AFTER** the `operation`
has been applied successfully.

#### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | `RecordOperation` |

#### Returns

`RecordOperation`[]

#### Inherited from

[SyncOperationProcessor](SyncOperationProcessor.md).[after](SyncOperationProcessor.md#after)

#### Defined in

[record-cache/src/sync-operation-processor.ts:64](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-operation-processor.ts#L64)

___

### before

▸ **before**(`operation`): `RecordOperation`[]

Called before an `operation` has been applied.

Returns an array of operations to be applied **BEFORE** the `operation`
itself is applied.

#### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | `RecordOperation` |

#### Returns

`RecordOperation`[]

#### Inherited from

[SyncOperationProcessor](SyncOperationProcessor.md).[before](SyncOperationProcessor.md#before)

#### Defined in

[record-cache/src/sync-operation-processor.ts:54](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-operation-processor.ts#L54)

___

### finally

▸ **finally**(`operation`): `RecordOperation`[]

Called after an `operation` _and_ any related operations have been applied.

Returns an array of operations to be applied **AFTER** the `operation`
itself and any operations returned from the `after` hook have been applied.

#### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | `RecordOperation` |

#### Returns

`RecordOperation`[]

#### Inherited from

[SyncOperationProcessor](SyncOperationProcessor.md).[finally](SyncOperationProcessor.md#finally)

#### Defined in

[record-cache/src/sync-operation-processor.ts:83](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-operation-processor.ts#L83)

___

### immediate

▸ **immediate**(`operation`): `void`

Called immediately after an `operation` has been applied and before the
`patch` event has been emitted (i.e. before any listeners have been
notified that the operation was applied).

No operations may be returned.

#### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | `RecordOperation` |

#### Returns

`void`

#### Inherited from

[SyncOperationProcessor](SyncOperationProcessor.md).[immediate](SyncOperationProcessor.md#immediate)

#### Defined in

[record-cache/src/sync-operation-processor.ts:75](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-operation-processor.ts#L75)

___

### reset

▸ **reset**(`base?`): `void`

Called when all the data in a cache has been reset.

If `base` is included, the cache is being reset to match a base cache.

#### Parameters

| Name | Type |
| :------ | :------ |
| `base?` | [`SyncRecordAccessor`](../interfaces/SyncRecordAccessor.md) |

#### Returns

`void`

#### Inherited from

[SyncOperationProcessor](SyncOperationProcessor.md).[reset](SyncOperationProcessor.md#reset)

#### Defined in

[record-cache/src/sync-operation-processor.ts:36](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-operation-processor.ts#L36)

___

### upgrade

▸ **upgrade**(): `void`

Allow the processor to perform an upgrade as part of a cache upgrade.

#### Returns

`void`

#### Inherited from

[SyncOperationProcessor](SyncOperationProcessor.md).[upgrade](SyncOperationProcessor.md#upgrade)

#### Defined in

[record-cache/src/sync-operation-processor.ts:41](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-operation-processor.ts#L41)

___

### validate

▸ **validate**(`operation`): `void`

Validates an operation before processing it.

#### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | `RecordOperation` |

#### Returns

`void`

#### Overrides

[SyncOperationProcessor](SyncOperationProcessor.md).[validate](SyncOperationProcessor.md#validate)

#### Defined in

[record-cache/src/operation-processors/sync-schema-validation-processor.ts:37](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/operation-processors/sync-schema-validation-processor.ts#L37)
