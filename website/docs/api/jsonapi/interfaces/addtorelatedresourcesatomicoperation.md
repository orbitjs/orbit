---
id: "AddToRelatedResourcesAtomicOperation"
title: "Interface: AddToRelatedResourcesAtomicOperation"
sidebar_label: "AddToRelatedResourcesAtomicOperation"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- [`ResourceAtomicOperation`](ResourceAtomicOperation.md)

  ↳ **`AddToRelatedResourcesAtomicOperation`**

## Properties

### data

• **data**: [`Resource`](Resource.md)

#### Overrides

[ResourceAtomicOperation](ResourceAtomicOperation.md).[data](ResourceAtomicOperation.md#data)

#### Defined in

[packages/@orbit/jsonapi/src/resource-operations.ts:49](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/resource-operations.ts#L49)

___

### op

• **op**: ``"add"``

#### Overrides

[ResourceAtomicOperation](ResourceAtomicOperation.md).[op](ResourceAtomicOperation.md#op)

#### Defined in

[packages/@orbit/jsonapi/src/resource-operations.ts:43](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/resource-operations.ts#L43)

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

[packages/@orbit/jsonapi/src/resource-operations.ts:44](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/resource-operations.ts#L44)
