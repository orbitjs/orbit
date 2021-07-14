---
id: "SyncOperationProcessor"
title: "Class: SyncOperationProcessor"
sidebar_label: "SyncOperationProcessor"
sidebar_position: 0
custom_edit_url: null
---

Operation processors are used to identify operations that should be performed
together to ensure that a `Cache` or other container of data remains
consistent and correct.

`OperationProcessor` is an abstract base class to be extended by specific
operation processors.

## Hierarchy

- **`SyncOperationProcessor`**

  ↳ [`SyncCacheIntegrityProcessor`](SyncCacheIntegrityProcessor.md)

  ↳ [`SyncSchemaConsistencyProcessor`](SyncSchemaConsistencyProcessor.md)

  ↳ [`SyncSchemaValidationProcessor`](SyncSchemaValidationProcessor.md)

## Constructors

### constructor

• **new SyncOperationProcessor**(`accessor`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `accessor` | [`SyncRecordAccessor`](../interfaces/SyncRecordAccessor.md) |

#### Defined in

[record-cache/src/sync-operation-processor.ts:27](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-operation-processor.ts#L27)

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

#### Defined in

[record-cache/src/sync-operation-processor.ts:36](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-operation-processor.ts#L36)

___

### upgrade

▸ **upgrade**(): `void`

Allow the processor to perform an upgrade as part of a cache upgrade.

#### Returns

`void`

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

#### Defined in

[record-cache/src/sync-operation-processor.ts:46](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/sync-operation-processor.ts#L46)
