---
id: "AsyncInverseTransformOperator"
title: "Interface: AsyncInverseTransformOperator"
sidebar_label: "AsyncInverseTransformOperator"
sidebar_position: 0
custom_edit_url: null
---

## Callable

### AsyncInverseTransformOperator

▸ **AsyncInverseTransformOperator**(`cache`, `operation`, `options?`): `Promise`<`undefined` \| `AddRecordOperation` \| `UpdateRecordOperation` \| `RemoveRecordOperation` \| `ReplaceKeyOperation` \| `ReplaceAttributeOperation` \| `AddToRelatedRecordsOperation` \| `RemoveFromRelatedRecordsOperation` \| `ReplaceRelatedRecordsOperation` \| `ReplaceRelatedRecordOperation`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `cache` | [`AsyncRecordAccessor`](AsyncRecordAccessor.md) |
| `operation` | `RecordOperation` |
| `options?` | `RequestOptions` |

#### Returns

`Promise`<`undefined` \| `AddRecordOperation` \| `UpdateRecordOperation` \| `RemoveRecordOperation` \| `ReplaceKeyOperation` \| `ReplaceAttributeOperation` \| `AddToRelatedRecordsOperation` \| `RemoveFromRelatedRecordsOperation` \| `ReplaceRelatedRecordsOperation` \| `ReplaceRelatedRecordOperation`\>

#### Defined in

[record-cache/src/operators/async-inverse-transform-operators.ts:24](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/record-cache/src/operators/async-inverse-transform-operators.ts#L24)
