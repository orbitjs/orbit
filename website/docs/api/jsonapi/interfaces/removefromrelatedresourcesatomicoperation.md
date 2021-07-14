---
id: "RemoveFromRelatedResourcesAtomicOperation"
title: "Interface: RemoveFromRelatedResourcesAtomicOperation"
sidebar_label: "RemoveFromRelatedResourcesAtomicOperation"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- [`ResourceAtomicOperation`](ResourceAtomicOperation.md)

  ↳ **`RemoveFromRelatedResourcesAtomicOperation`**

## Properties

### data

• **data**: [`Resource`](Resource.md)

#### Overrides

[ResourceAtomicOperation](ResourceAtomicOperation.md).[data](ResourceAtomicOperation.md#data)

#### Defined in

[packages/@orbit/jsonapi/src/resource-operations.ts:60](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/resource-operations.ts#L60)

___

### op

• **op**: ``"remove"``

#### Overrides

[ResourceAtomicOperation](ResourceAtomicOperation.md).[op](ResourceAtomicOperation.md#op)

#### Defined in

[packages/@orbit/jsonapi/src/resource-operations.ts:54](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/resource-operations.ts#L54)

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

[packages/@orbit/jsonapi/src/resource-operations.ts:55](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/resource-operations.ts#L55)
