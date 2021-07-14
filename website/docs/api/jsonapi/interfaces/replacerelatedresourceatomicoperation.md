---
id: "ReplaceRelatedResourceAtomicOperation"
title: "Interface: ReplaceRelatedResourceAtomicOperation"
sidebar_label: "ReplaceRelatedResourceAtomicOperation"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- [`ResourceAtomicOperation`](ResourceAtomicOperation.md)

  ↳ **`ReplaceRelatedResourceAtomicOperation`**

## Properties

### data

• **data**: ``null`` \| [`Resource`](Resource.md)

#### Overrides

[ResourceAtomicOperation](ResourceAtomicOperation.md).[data](ResourceAtomicOperation.md#data)

#### Defined in

[packages/@orbit/jsonapi/src/resource-operations.ts:71](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/resource-operations.ts#L71)

___

### op

• **op**: ``"update"``

#### Overrides

[ResourceAtomicOperation](ResourceAtomicOperation.md).[op](ResourceAtomicOperation.md#op)

#### Defined in

[packages/@orbit/jsonapi/src/resource-operations.ts:65](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/resource-operations.ts#L65)

___

### ref

• **ref**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `id` | `string` |
| `relationship` | `string` |
| `type` | `string` |

#### Overrides

[ResourceAtomicOperation](ResourceAtomicOperation.md).[ref](ResourceAtomicOperation.md#ref)

#### Defined in

[packages/@orbit/jsonapi/src/resource-operations.ts:66](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/resource-operations.ts#L66)
