---
id: "SyncTransformOperator"
title: "Interface: SyncTransformOperator"
sidebar_label: "SyncTransformOperator"
sidebar_position: 0
custom_edit_url: null
---

## Callable

### SyncTransformOperator

▸ **SyncTransformOperator**(`cache`, `operation`, `options?`): `RecordOperationResult`<`InitializedRecord`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `cache` | [`SyncRecordAccessor`](SyncRecordAccessor.md) |
| `operation` | `RecordOperation` |
| `options?` | `RequestOptions` |

#### Returns

`RecordOperationResult`<`InitializedRecord`\>

#### Defined in

[record-cache/src/operators/sync-transform-operators.ts:26](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/operators/sync-transform-operators.ts#L26)
