---
id: "SyncInverseTransformOperator"
title: "Interface: SyncInverseTransformOperator"
sidebar_label: "SyncInverseTransformOperator"
sidebar_position: 0
custom_edit_url: null
---

## Callable

### SyncInverseTransformOperator

▸ **SyncInverseTransformOperator**(`cache`, `operation`, `options?`): `undefined` \| `AddRecordOperation` \| `UpdateRecordOperation` \| `RemoveRecordOperation` \| `ReplaceKeyOperation` \| `ReplaceAttributeOperation` \| `AddToRelatedRecordsOperation` \| `RemoveFromRelatedRecordsOperation` \| `ReplaceRelatedRecordsOperation` \| `ReplaceRelatedRecordOperation`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cache` | [`SyncRecordAccessor`](SyncRecordAccessor.md) |
| `operation` | `RecordOperation` |
| `options?` | `RequestOptions` |

#### Returns

`undefined` \| `AddRecordOperation` \| `UpdateRecordOperation` \| `RemoveRecordOperation` \| `ReplaceKeyOperation` \| `ReplaceAttributeOperation` \| `AddToRelatedRecordsOperation` \| `RemoveFromRelatedRecordsOperation` \| `ReplaceRelatedRecordsOperation` \| `ReplaceRelatedRecordOperation`

#### Defined in

[record-cache/src/operators/sync-inverse-transform-operators.ts:24](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/operators/sync-inverse-transform-operators.ts#L24)
