---
id: "AsyncSchemaConsistencyProcessor"
title: "Class: AsyncSchemaConsistencyProcessor"
sidebar_label: "AsyncSchemaConsistencyProcessor"
sidebar_position: 0
custom_edit_url: null
---

An operation processor that ensures that a cache's data is consistent with
its associated schema. This includes maintenance of inverse and dependent
relationships.

## Hierarchy

- [`AsyncOperationProcessor`](AsyncOperationProcessor.md)

  ↳ **`AsyncSchemaConsistencyProcessor`**

## Constructors

### constructor

• **new AsyncSchemaConsistencyProcessor**(`accessor`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `accessor` | [`AsyncRecordAccessor`](../interfaces/AsyncRecordAccessor.md) |

#### Inherited from

[AsyncOperationProcessor](AsyncOperationProcessor.md).[constructor](AsyncOperationProcessor.md#constructor)

#### Defined in

[record-cache/src/async-operation-processor.ts:27](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-operation-processor.ts#L27)

## Accessors

### accessor

• `get` **accessor**(): [`AsyncRecordAccessor`](../interfaces/AsyncRecordAccessor.md)

The `AsyncRecordAccessor` that is monitored.

#### Returns

[`AsyncRecordAccessor`](../interfaces/AsyncRecordAccessor.md)

#### Defined in

[record-cache/src/async-operation-processor.ts:23](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-operation-processor.ts#L23)

## Methods

### after

▸ **after**(`operation`): `Promise`<`RecordOperation`[]\>

Called before an `operation` has been applied.

Returns an array of operations to be applied **AFTER** the `operation`
has been applied successfully.

#### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | `RecordOperation` |

#### Returns

`Promise`<`RecordOperation`[]\>

#### Overrides

[AsyncOperationProcessor](AsyncOperationProcessor.md).[after](AsyncOperationProcessor.md#after)

#### Defined in

[record-cache/src/operation-processors/async-schema-consistency-processor.ts:19](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/operation-processors/async-schema-consistency-processor.ts#L19)

___

### before

▸ **before**(`operation`): `Promise`<`RecordOperation`[]\>

Called before an `operation` has been applied.

Returns an array of operations to be applied **BEFORE** the `operation`
itself is applied.

#### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | `RecordOperation` |

#### Returns

`Promise`<`RecordOperation`[]\>

#### Inherited from

[AsyncOperationProcessor](AsyncOperationProcessor.md).[before](AsyncOperationProcessor.md#before)

#### Defined in

[record-cache/src/async-operation-processor.ts:60](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-operation-processor.ts#L60)

___

### finally

▸ **finally**(`operation`): `Promise`<`RecordOperation`[]\>

Called after an `operation` _and_ any related operations have been applied.

Returns an array of operations to be applied **AFTER** the `operation`
itself and any operations returned from the `after` hook have been applied.

#### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | `RecordOperation` |

#### Returns

`Promise`<`RecordOperation`[]\>

#### Inherited from

[AsyncOperationProcessor](AsyncOperationProcessor.md).[finally](AsyncOperationProcessor.md#finally)

#### Defined in

[record-cache/src/async-operation-processor.ts:91](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-operation-processor.ts#L91)

___

### immediate

▸ **immediate**(`operation`): `Promise`<`void`\>

Called immediately after an `operation` has been applied and before the
`patch` event has been emitted (i.e. before any listeners have been
notified that the operation was applied).

No operations may be returned.

#### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | `RecordOperation` |

#### Returns

`Promise`<`void`\>

#### Inherited from

[AsyncOperationProcessor](AsyncOperationProcessor.md).[immediate](AsyncOperationProcessor.md#immediate)

#### Defined in

[record-cache/src/async-operation-processor.ts:81](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-operation-processor.ts#L81)

___

### reset

▸ **reset**(`base?`): `Promise`<`void`\>

Called when all the data in a cache has been reset.

If `base` is included, the cache is being reset to match a base cache.

#### Parameters

| Name | Type |
| :------ | :------ |
| `base?` | [`AsyncRecordAccessor`](../interfaces/AsyncRecordAccessor.md) |

#### Returns

`Promise`<`void`\>

#### Inherited from

[AsyncOperationProcessor](AsyncOperationProcessor.md).[reset](AsyncOperationProcessor.md#reset)

#### Defined in

[record-cache/src/async-operation-processor.ts:36](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-operation-processor.ts#L36)

___

### upgrade

▸ **upgrade**(): `Promise`<`void`\>

Allow the processor to perform an upgrade as part of a cache upgrade.

#### Returns

`Promise`<`void`\>

#### Inherited from

[AsyncOperationProcessor](AsyncOperationProcessor.md).[upgrade](AsyncOperationProcessor.md#upgrade)

#### Defined in

[record-cache/src/async-operation-processor.ts:43](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-operation-processor.ts#L43)

___

### validate

▸ **validate**(`operation`): `Promise`<`void`\>

Validates an operation before processing it.

#### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | `RecordOperation` |

#### Returns

`Promise`<`void`\>

#### Inherited from

[AsyncOperationProcessor](AsyncOperationProcessor.md).[validate](AsyncOperationProcessor.md#validate)

#### Defined in

[record-cache/src/async-operation-processor.ts:50](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/async-operation-processor.ts#L50)
