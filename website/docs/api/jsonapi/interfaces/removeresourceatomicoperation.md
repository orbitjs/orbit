---
id: "RemoveResourceAtomicOperation"
title: "Interface: RemoveResourceAtomicOperation"
sidebar_label: "RemoveResourceAtomicOperation"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- [`ResourceAtomicOperation`](ResourceAtomicOperation.md)

  ↳ **`RemoveResourceAtomicOperation`**

## Properties

### data

• `Optional` **data**: ``null`` \| [`Resource`](Resource.md) \| [`Resource`](Resource.md)[]

#### Inherited from

[ResourceAtomicOperation](ResourceAtomicOperation.md).[data](ResourceAtomicOperation.md#data)

#### Defined in

[packages/@orbit/jsonapi/src/resource-operations.ts:12](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/resource-operations.ts#L12)

___

### op

• **op**: ``"remove"``

#### Overrides

[ResourceAtomicOperation](ResourceAtomicOperation.md).[op](ResourceAtomicOperation.md#op)

#### Defined in

[packages/@orbit/jsonapi/src/resource-operations.ts:34](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/resource-operations.ts#L34)

___

### ref

• **ref**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `id` | `string` |
| `type` | `string` |

#### Overrides

[ResourceAtomicOperation](ResourceAtomicOperation.md).[ref](ResourceAtomicOperation.md#ref)

#### Defined in

[packages/@orbit/jsonapi/src/resource-operations.ts:35](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/resource-operations.ts#L35)
