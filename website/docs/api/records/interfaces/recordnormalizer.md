---
id: "RecordNormalizer"
title: "Interface: RecordNormalizer<RT, RI, R>"
sidebar_label: "RecordNormalizer"
sidebar_position: 0
custom_edit_url: null
---

## Type parameters

| Name | Type |
| :------ | :------ |
| `RT` | `string` |
| `RI` | [`RecordIdentity`](RecordIdentity.md) |
| `R` | [`UninitializedRecord`](UninitializedRecord.md) |

## Implemented by

- [`StandardRecordNormalizer`](../classes/StandardRecordNormalizer.md)

## Methods

### normalizeRecord

▸ **normalizeRecord**(`record`): [`InitializedRecord`](InitializedRecord.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | `R` |

#### Returns

[`InitializedRecord`](InitializedRecord.md)

#### Defined in

[packages/@orbit/records/src/record-normalizer.ts:14](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-normalizer.ts#L14)

___

### normalizeRecordIdentity

▸ **normalizeRecordIdentity**(`recordIdentity`): [`RecordIdentity`](RecordIdentity.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `recordIdentity` | `RI` |

#### Returns

[`RecordIdentity`](RecordIdentity.md)

#### Defined in

[packages/@orbit/records/src/record-normalizer.ts:13](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-normalizer.ts#L13)

___

### normalizeRecordType

▸ **normalizeRecordType**(`recordType`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `recordType` | `RT` |

#### Returns

`string`

#### Defined in

[packages/@orbit/records/src/record-normalizer.ts:12](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-normalizer.ts#L12)
