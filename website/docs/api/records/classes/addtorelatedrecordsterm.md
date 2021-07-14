---
id: "AddToRelatedRecordsTerm"
title: "Class: AddToRelatedRecordsTerm<RT, RI, R>"
sidebar_label: "AddToRelatedRecordsTerm"
sidebar_position: 0
custom_edit_url: null
---

## Type parameters

| Name | Type |
| :------ | :------ |
| `RT` | `string` |
| `RI` | [`RecordIdentity`](../interfaces/RecordIdentity.md) |
| `R` | [`UninitializedRecord`](../interfaces/UninitializedRecord.md) |

## Hierarchy

- [`BaseRecordOperationTerm`](BaseRecordOperationTerm.md)<[`AddToRelatedRecordsOperation`](../interfaces/AddToRelatedRecordsOperation.md), `RT`, `RI`, `R`\>

  ↳ **`AddToRelatedRecordsTerm`**

## Constructors

### constructor

• **new AddToRelatedRecordsTerm**<`RT`, `RI`, `R`\>(`transformBuilder`, `record`, `relationship`, `relatedRecord`)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RT` | `string` |
| `RI` | [`RecordIdentity`](../interfaces/RecordIdentity.md) |
| `R` | [`UninitializedRecord`](../interfaces/UninitializedRecord.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `transformBuilder` | [`RecordTransformBuilder`](RecordTransformBuilder.md)<`RT`, `RI`, `R`\> |
| `record` | [`RecordIdentity`](../interfaces/RecordIdentity.md) |
| `relationship` | `string` |
| `relatedRecord` | [`RecordIdentity`](../interfaces/RecordIdentity.md) |

#### Overrides

[BaseRecordOperationTerm](BaseRecordOperationTerm.md).[constructor](BaseRecordOperationTerm.md#constructor)

#### Defined in

[packages/@orbit/records/src/record-operation-term.ts:161](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation-term.ts#L161)

## Properties

### $transformBuilder

• **$transformBuilder**: [`RecordTransformBuilder`](RecordTransformBuilder.md)<`RT`, `RI`, `R`\>

#### Inherited from

[BaseRecordOperationTerm](BaseRecordOperationTerm.md).[$transformBuilder](BaseRecordOperationTerm.md#$transformbuilder)

#### Defined in

[packages/@orbit/records/src/record-operation-term.ts:31](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation-term.ts#L31)

## Methods

### options

▸ **options**(`options`): [`AddToRelatedRecordsTerm`](AddToRelatedRecordsTerm.md)<`RT`, `RI`, `R`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `RequestOptions` |

#### Returns

[`AddToRelatedRecordsTerm`](AddToRelatedRecordsTerm.md)<`RT`, `RI`, `R`\>

#### Inherited from

[BaseRecordOperationTerm](BaseRecordOperationTerm.md).[options](BaseRecordOperationTerm.md#options)

#### Defined in

packages/@orbit/data/dist/modules/operation-term.d.ts:11

___

### toOperation

▸ **toOperation**(): [`AddToRelatedRecordsOperation`](../interfaces/AddToRelatedRecordsOperation.md)

#### Returns

[`AddToRelatedRecordsOperation`](../interfaces/AddToRelatedRecordsOperation.md)

#### Inherited from

[BaseRecordOperationTerm](BaseRecordOperationTerm.md).[toOperation](BaseRecordOperationTerm.md#tooperation)

#### Defined in

[packages/@orbit/records/src/record-operation-term.ts:41](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation-term.ts#L41)
