---
id: "ReplaceKeyTerm"
title: "Class: ReplaceKeyTerm<RT, RI, R>"
sidebar_label: "ReplaceKeyTerm"
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

- [`BaseRecordOperationTerm`](BaseRecordOperationTerm.md)<[`ReplaceKeyOperation`](../interfaces/ReplaceKeyOperation.md), `RT`, `RI`, `R`\>

  ↳ **`ReplaceKeyTerm`**

## Constructors

### constructor

• **new ReplaceKeyTerm**<`RT`, `RI`, `R`\>(`transformBuilder`, `record`, `key`, `value`)

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
| `key` | `string` |
| `value` | `string` |

#### Overrides

[BaseRecordOperationTerm](BaseRecordOperationTerm.md).[constructor](BaseRecordOperationTerm.md#constructor)

#### Defined in

[packages/@orbit/records/src/record-operation-term.ts:141](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation-term.ts#L141)

## Properties

### $transformBuilder

• **$transformBuilder**: [`RecordTransformBuilder`](RecordTransformBuilder.md)<`RT`, `RI`, `R`\>

#### Inherited from

[BaseRecordOperationTerm](BaseRecordOperationTerm.md).[$transformBuilder](BaseRecordOperationTerm.md#$transformbuilder)

#### Defined in

[packages/@orbit/records/src/record-operation-term.ts:31](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation-term.ts#L31)

## Methods

### options

▸ **options**(`options`): [`ReplaceKeyTerm`](ReplaceKeyTerm.md)<`RT`, `RI`, `R`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `RequestOptions` |

#### Returns

[`ReplaceKeyTerm`](ReplaceKeyTerm.md)<`RT`, `RI`, `R`\>

#### Inherited from

[BaseRecordOperationTerm](BaseRecordOperationTerm.md).[options](BaseRecordOperationTerm.md#options)

#### Defined in

packages/@orbit/data/dist/modules/operation-term.d.ts:11

___

### toOperation

▸ **toOperation**(): [`ReplaceKeyOperation`](../interfaces/ReplaceKeyOperation.md)

#### Returns

[`ReplaceKeyOperation`](../interfaces/ReplaceKeyOperation.md)

#### Inherited from

[BaseRecordOperationTerm](BaseRecordOperationTerm.md).[toOperation](BaseRecordOperationTerm.md#tooperation)

#### Defined in

[packages/@orbit/records/src/record-operation-term.ts:41](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation-term.ts#L41)
