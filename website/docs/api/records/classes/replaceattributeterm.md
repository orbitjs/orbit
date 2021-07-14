---
id: "ReplaceAttributeTerm"
title: "Class: ReplaceAttributeTerm<RT, RI, R>"
sidebar_label: "ReplaceAttributeTerm"
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

- [`BaseRecordOperationTerm`](BaseRecordOperationTerm.md)<[`ReplaceAttributeOperation`](../interfaces/ReplaceAttributeOperation.md), `RT`, `RI`, `R`\>

  ↳ **`ReplaceAttributeTerm`**

## Constructors

### constructor

• **new ReplaceAttributeTerm**<`RT`, `RI`, `R`\>(`transformBuilder`, `record`, `attribute`, `value`)

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
| `attribute` | `string` |
| `value` | `unknown` |

#### Overrides

[BaseRecordOperationTerm](BaseRecordOperationTerm.md).[constructor](BaseRecordOperationTerm.md#constructor)

#### Defined in

[packages/@orbit/records/src/record-operation-term.ts:121](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation-term.ts#L121)

## Properties

### $transformBuilder

• **$transformBuilder**: [`RecordTransformBuilder`](RecordTransformBuilder.md)<`RT`, `RI`, `R`\>

#### Inherited from

[BaseRecordOperationTerm](BaseRecordOperationTerm.md).[$transformBuilder](BaseRecordOperationTerm.md#$transformbuilder)

#### Defined in

[packages/@orbit/records/src/record-operation-term.ts:31](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation-term.ts#L31)

## Methods

### options

▸ **options**(`options`): [`ReplaceAttributeTerm`](ReplaceAttributeTerm.md)<`RT`, `RI`, `R`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `RequestOptions` |

#### Returns

[`ReplaceAttributeTerm`](ReplaceAttributeTerm.md)<`RT`, `RI`, `R`\>

#### Inherited from

[BaseRecordOperationTerm](BaseRecordOperationTerm.md).[options](BaseRecordOperationTerm.md#options)

#### Defined in

packages/@orbit/data/dist/modules/operation-term.d.ts:11

___

### toOperation

▸ **toOperation**(): [`ReplaceAttributeOperation`](../interfaces/ReplaceAttributeOperation.md)

#### Returns

[`ReplaceAttributeOperation`](../interfaces/ReplaceAttributeOperation.md)

#### Inherited from

[BaseRecordOperationTerm](BaseRecordOperationTerm.md).[toOperation](BaseRecordOperationTerm.md#tooperation)

#### Defined in

[packages/@orbit/records/src/record-operation-term.ts:41](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation-term.ts#L41)
