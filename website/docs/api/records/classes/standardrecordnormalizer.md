---
id: "StandardRecordNormalizer"
title: "Class: StandardRecordNormalizer"
sidebar_label: "StandardRecordNormalizer"
sidebar_position: 0
custom_edit_url: null
---

## Implements

- [`RecordNormalizer`](../interfaces/RecordNormalizer.md)<`string`, [`RecordIdentity`](../interfaces/RecordIdentity.md) \| [`RecordKeyValue`](../interfaces/RecordKeyValue.md), [`UninitializedRecord`](../interfaces/UninitializedRecord.md)\>

## Constructors

### constructor

• **new StandardRecordNormalizer**(`settings`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`StandardRecordNormalizerSettings`](../interfaces/StandardRecordNormalizerSettings.md) |

#### Defined in

[packages/@orbit/records/src/standard-record-normalizer.ts:37](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/standard-record-normalizer.ts#L37)

## Properties

### cloneInputs

• `Optional` **cloneInputs**: `boolean`

#### Defined in

[packages/@orbit/records/src/standard-record-normalizer.ts:34](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/standard-record-normalizer.ts#L34)

___

### keyMap

• `Optional` **keyMap**: [`RecordKeyMap`](RecordKeyMap.md)

#### Defined in

[packages/@orbit/records/src/standard-record-normalizer.ts:33](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/standard-record-normalizer.ts#L33)

___

### schema

• **schema**: [`RecordSchema`](RecordSchema.md)

#### Defined in

[packages/@orbit/records/src/standard-record-normalizer.ts:32](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/standard-record-normalizer.ts#L32)

___

### validateInputs

• `Optional` **validateInputs**: `boolean`

#### Defined in

[packages/@orbit/records/src/standard-record-normalizer.ts:35](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/standard-record-normalizer.ts#L35)

## Methods

### normalizeRecord

▸ **normalizeRecord**(`record`): [`InitializedRecord`](../interfaces/InitializedRecord.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | [`UninitializedRecord`](../interfaces/UninitializedRecord.md) |

#### Returns

[`InitializedRecord`](../interfaces/InitializedRecord.md)

#### Implementation of

[RecordNormalizer](../interfaces/RecordNormalizer.md).[normalizeRecord](../interfaces/RecordNormalizer.md#normalizerecord)

#### Defined in

[packages/@orbit/records/src/standard-record-normalizer.ts:113](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/standard-record-normalizer.ts#L113)

___

### normalizeRecordIdentity

▸ **normalizeRecordIdentity**(`identity`): [`RecordIdentity`](../interfaces/RecordIdentity.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `identity` | [`RecordIdentity`](../interfaces/RecordIdentity.md) \| [`RecordKeyValue`](../interfaces/RecordKeyValue.md) |

#### Returns

[`RecordIdentity`](../interfaces/RecordIdentity.md)

#### Implementation of

[RecordNormalizer](../interfaces/RecordNormalizer.md).[normalizeRecordIdentity](../interfaces/RecordNormalizer.md#normalizerecordidentity)

#### Defined in

[packages/@orbit/records/src/standard-record-normalizer.ts:71](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/standard-record-normalizer.ts#L71)

___

### normalizeRecordType

▸ **normalizeRecordType**(`type`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |

#### Returns

`string`

#### Implementation of

[RecordNormalizer](../interfaces/RecordNormalizer.md).[normalizeRecordType](../interfaces/RecordNormalizer.md#normalizerecordtype)

#### Defined in

[packages/@orbit/records/src/standard-record-normalizer.ts:55](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/standard-record-normalizer.ts#L55)
