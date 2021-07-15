---
id: "ReplaceRelatedResourcesAtomicOperation"
title: "Interface: ReplaceRelatedResourcesAtomicOperation"
sidebar_label: "ReplaceRelatedResourcesAtomicOperation"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- [`ResourceAtomicOperation`](ResourceAtomicOperation.md)

  ↳ **`ReplaceRelatedResourcesAtomicOperation`**

## Properties

### data

• **data**: [`Resource`](Resource.md)[]

#### Overrides

[ResourceAtomicOperation](ResourceAtomicOperation.md).[data](ResourceAtomicOperation.md#data)

#### Defined in

[packages/@orbit/jsonapi/src/resource-operations.ts:82](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/resource-operations.ts#L82)

___

### op

• **op**: ``"update"``

#### Overrides

[ResourceAtomicOperation](ResourceAtomicOperation.md).[op](ResourceAtomicOperation.md#op)

#### Defined in

[packages/@orbit/jsonapi/src/resource-operations.ts:76](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/resource-operations.ts#L76)

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

[packages/@orbit/jsonapi/src/resource-operations.ts:77](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/resource-operations.ts#L77)
