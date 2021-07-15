---
id: "BaseRecordOperationTerm"
title: "Class: BaseRecordOperationTerm<O, RT, RI, R>"
sidebar_label: "BaseRecordOperationTerm"
sidebar_position: 0
custom_edit_url: null
---

## Type parameters

| Name | Type |
| :------ | :------ |
| `O` | extends [`RecordOperation`](../modules.md#recordoperation) |
| `RT` | `string` |
| `RI` | [`RecordIdentity`](../interfaces/RecordIdentity.md) |
| `R` | [`UninitializedRecord`](../interfaces/UninitializedRecord.md) |

## Hierarchy

- `OperationTerm`<`O`\>

  ↳ **`BaseRecordOperationTerm`**

  ↳↳ [`AddRecordTerm`](AddRecordTerm.md)

  ↳↳ [`UpdateRecordTerm`](UpdateRecordTerm.md)

  ↳↳ [`RemoveRecordTerm`](RemoveRecordTerm.md)

  ↳↳ [`ReplaceAttributeTerm`](ReplaceAttributeTerm.md)

  ↳↳ [`ReplaceKeyTerm`](ReplaceKeyTerm.md)

  ↳↳ [`AddToRelatedRecordsTerm`](AddToRelatedRecordsTerm.md)

  ↳↳ [`RemoveFromRelatedRecordsTerm`](RemoveFromRelatedRecordsTerm.md)

  ↳↳ [`ReplaceRelatedRecordsTerm`](ReplaceRelatedRecordsTerm.md)

  ↳↳ [`ReplaceRelatedRecordTerm`](ReplaceRelatedRecordTerm.md)

## Constructors

### constructor

• **new BaseRecordOperationTerm**<`O`, `RT`, `RI`, `R`\>(`transformBuilder`, `operation`)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `O` | extends [`RecordOperation`](../modules.md#recordoperation) |
| `RT` | `string` |
| `RI` | [`RecordIdentity`](../interfaces/RecordIdentity.md) |
| `R` | [`UninitializedRecord`](../interfaces/UninitializedRecord.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `transformBuilder` | [`RecordTransformBuilder`](RecordTransformBuilder.md)<`RT`, `RI`, `R`\> |
| `operation` | `O` |

#### Overrides

OperationTerm&lt;O\&gt;.constructor

#### Defined in

[packages/@orbit/records/src/record-operation-term.ts:33](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation-term.ts#L33)

## Properties

### $transformBuilder

• **$transformBuilder**: [`RecordTransformBuilder`](RecordTransformBuilder.md)<`RT`, `RI`, `R`\>

#### Defined in

[packages/@orbit/records/src/record-operation-term.ts:31](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation-term.ts#L31)

## Methods

### options

▸ **options**(`options`): [`BaseRecordOperationTerm`](BaseRecordOperationTerm.md)<`O`, `RT`, `RI`, `R`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `RequestOptions` |

#### Returns

[`BaseRecordOperationTerm`](BaseRecordOperationTerm.md)<`O`, `RT`, `RI`, `R`\>

#### Inherited from

OperationTerm.options

#### Defined in

packages/@orbit/data/dist/modules/operation-term.d.ts:11

___

### toOperation

▸ **toOperation**(): `O`

#### Returns

`O`

#### Overrides

OperationTerm.toOperation

#### Defined in

[packages/@orbit/records/src/record-operation-term.ts:41](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation-term.ts#L41)
